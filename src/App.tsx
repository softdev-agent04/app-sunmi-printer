import { useEffect, useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Printer, type OrderReceiptInfo } from "@desipayments/sunmi-printer";

// ============================================================
// APP COMPONENT
// ============================================================

function App() {
  // State
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string>("Checking...");
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string>("");
  const [printCount, setPrintCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "logs">("dashboard");
  const [orderType, setOrderType] = useState<"takeaway" | "table">("table");

  // Refs
  const logContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // HELPERS
  // ============================================================

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 100));
  };

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ============================================================
  // PLUGIN INIT
  // ============================================================

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    addLog(`Platform: ${platform}`);
    initializePrinter();

    return () => {
      Printer.destroy().catch(() => {});
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const initializePrinter = async () => {
    try {
      setError("");
      setStatus("Connecting...");
      addLog("🔧 Initializing printer...");

      const result = await Printer.initPrinter();

      addLog(`✅ Init: connected=${result.connected}, ready=${result.ready}`);
      addLog(`   Message: ${result.message}`);

      setConnected(result.connected);
      setReady(result.ready);
      setStatus(result.status);

      if (!result.connected) {
        setError("SUNMI printer not found");
        showNotification("Printer not found", "error");
      } else if (result.ready) {
        showNotification("Printer ready!", "success");
      }
    } catch (err: any) {
      console.error("SUNMI printer initialization failed:", err);
      addLog(`❌ Init error: ${err.message}`);
      setConnected(false);
      setReady(false);
      setStatus("disconnected");
      setError("Failed to initialize SUNMI printer");
      showNotification("Init failed", "error");
    }
  };

  const checkStatus = async () => {
    try {
      addLog("📊 Checking printer status...");
      const result = await Printer.getPrinterStatus();

      addLog(`📊 Status: connected=${result.connected}, ready=${result.ready}`);
      addLog(`   Status code: ${result.status}`);
      addLog(`   Status text: ${result.statusText}`);

      setConnected(result.connected);
      setReady(result.ready);

      if (!result.ready) {
        setError("Printer is not ready");
        showNotification("Printer not ready", "error");
      } else {
        setError("");
        showNotification(`Status: ${result.statusText}`, "success");
      }
    } catch (err: any) {
      console.error("Failed to get printer status:", err);
      addLog(`❌ Status error: ${err.message}`);
      setError("Failed to get printer status");
      showNotification("Status check failed", "error");
    }
  };

  // ============================================================
  // ORDER DATA - MATCHES OrderReceiptInfo
  // ============================================================

  const generateOrderData = (type: "takeaway" | "table"): OrderReceiptInfo => {
    const items = [
      { name: "Classic Burger", quantity: 2, rate: 12.99, total: 25.98 },
      { name: "Cheese Pizza", quantity: 1, rate: 14.99, total: 14.99 },
      { name: "French Fries", quantity: 3, rate: 4.99, total: 14.97 },
      { name: "  Extra Cheese", quantity: 1, rate: 1.50, total: 1.50, isModifier: true },
      { name: "Soft Drink", quantity: 2, rate: 2.99, total: 5.98 }
    ];

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * 0.10;
    const serviceCharge = type === "table" ? subtotal * 0.10 : 0;
    const discountAmount = subtotal * 0.05;
    const total = subtotal + taxAmount + serviceCharge - discountAmount;

    // Use different currency symbols for different order types
    const currencySymbol = type === "table" ? "$" : "৳";

    return {
      restaurantName: "OneBalance Restaurant",
      address: "8966 211th Street, Queens, NY 11427",
      phone: "+1 (929) 386-9131",
      email: "sales@onebalancepay.com",
      logo: "https://restaurant.onebalancepay.com/logo.png",

      orderNumber: type === "table" ? `TBL-${Date.now()}` : `TAK-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      salesType: type === "table" ? "Table: 05" : "Takeaway",
      server: type === "table" ? "John Doe" : "Counter",
      paymentMethod: "Card",

      currency_symbol: currencySymbol,

      subtotal,
      total,

      tax: { label: `Tax (10%):`, amount: taxAmount },
      fees: { label: `Fees (${currencySymbol}):`, amount: 0 },
      gratuity: { label: `Gratuity Fees (${currencySymbol}):`, amount: serviceCharge },
      discount: { label: `Discount (5%):`, amount: -discountAmount },
      tips: { label: `Tips (${currencySymbol}):`, amount: 0 },

      cardNumber: "•••• •••• •••• 1234",
      cardType: "Visa",

      items,

      footerMessage: type === "table"
        ? "Thank you for dining with us!\nWe hope you enjoyed your meal."
        : "Thank you for your takeaway order!\nWe hope to see you again!",

      showTipSuggestions: type === "table",
      tip5Tip: (total * 0.05).toFixed(2),
      tip5Total: (total * 1.05).toFixed(2),
      tip10Tip: (total * 0.10).toFixed(2),
      tip10Total: (total * 1.10).toFixed(2),
      tip15Tip: (total * 0.15).toFixed(2),
      tip15Total: (total * 1.15).toFixed(2),
      tip20Tip: (total * 0.20).toFixed(2),
      tip20Total: (total * 1.20).toFixed(2),
    };
  };

  // ============================================================
  // PRINT FUNCTIONS
  // ============================================================

  const printTest = async () => {
    if (!ready) {
      showNotification("Printer not ready", "error");
      return;
    }

    try {
      setIsPrinting(true);
      setError("");
      addLog("🖨️ Printing test receipt...");

      const result = await Printer.printTestReceipt({
        title: "SUNMI TEST RECEIPT",
        content: "Printer is working successfully.",
      });

      setPrintCount(prev => prev + 1);
      addLog(`✅ Test print complete: ${result.result}`);
      showNotification("Test receipt printed!", "success");
    } catch (err: any) {
      console.error("Test print failed:", err);
      addLog(`❌ Test print error: ${err.message}`);
      setError("Test print failed");
      showNotification("Test print failed", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const printReceipt = async (type: "takeaway" | "table") => {
    if (!ready) {
      showNotification("Printer not ready", "error");
      return;
    }

    try {
      setIsPrinting(true);
      setError("");
      const currencySymbol = type === "table" ? "$" : "৳";
      addLog(`🖨️ Printing ${type} receipt with ${currencySymbol}...`);

      const orderInfo = generateOrderData(type);

      addLog(`   Order: ${orderInfo.orderNumber}`);
      addLog(`   Currency: ${orderInfo.currency_symbol}`);
      addLog(`   Items: ${orderInfo.items.length}`);
      addLog(`   Subtotal: ${orderInfo.currency_symbol}${orderInfo.subtotal.toFixed(2)}`);
      addLog(`   Tax: ${orderInfo.currency_symbol}${orderInfo.tax.amount.toFixed(2)}`);
      addLog(`   Fees: ${orderInfo.currency_symbol}${orderInfo.fees.amount.toFixed(2)}`);
      addLog(`   Gratuity: ${orderInfo.currency_symbol}${orderInfo.gratuity.amount.toFixed(2)}`);
      addLog(`   Discount: ${orderInfo.currency_symbol}${orderInfo.discount.amount.toFixed(2)}`);
      addLog(`   Tips: ${orderInfo.currency_symbol}${orderInfo.tips.amount.toFixed(2)}`);
      addLog(`   Total: ${orderInfo.currency_symbol}${orderInfo.total.toFixed(2)}`);

      const result = await Printer.printReceipt({ orderInfo });

      setPrintCount(prev => prev + 1);
      addLog(`✅ ${type} receipt printed: ${result.result}`);
      showNotification(`${type} receipt printed with ${currencySymbol}!`, "success");
    } catch (err: any) {
      console.error("Receipt print failed:", err);
      addLog(`❌ Print error: ${err.message}`);
      setError("Receipt print failed");
      showNotification("Print failed", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const enableLogging = async () => {
    try {
      addLog("📝 Enabling logging...");
      const result = await Printer.enableLogging({
        enabled: true,
        tag: "PrinterApp"
      });
      addLog(`✅ Logging enabled: ${result.result}`);
      showNotification("Logging enabled", "success");
    } catch (err: any) {
      addLog(`❌ Enable logging error: ${err.message}`);
      showNotification("Failed to enable logging", "error");
    }
  };

  const destroyPrinter = async () => {
    try {
      addLog("🔌 Destroying printer...");
      const result = await Printer.destroy();
      setConnected(false);
      setReady(false);
      setStatus("destroyed");
      addLog(`✅ Destroyed: ${result.result}`);
      showNotification("Printer destroyed", "info");
    } catch (err: any) {
      addLog(`❌ Destroy error: ${err.message}`);
      showNotification("Destroy failed", "error");
    }
  };

  // ============================================================
  // PREMIUM STYLES
  // ============================================================

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      padding: "20px",
      color: "#ffffff"
    },
    header: {
      color: "#ffffff",
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "2px solid rgba(255,255,255,0.2)"
    },
    card: {
      background: "rgba(255, 255, 255, 0.12)",
      backdropFilter: "blur(10px)",
      padding: "24px",
      borderRadius: "16px",
      marginBottom: "16px",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
    },
    button: {
      padding: "10px 20px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.2)",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
      transition: "all 0.3s ease",
      background: "rgba(255,255,255,0.15)",
      color: "#ffffff",
      backdropFilter: "blur(5px)"
    },
    primaryButton: {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#ffffff",
      border: "none"
    },
    dangerButton: {
      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      color: "#ffffff",
      border: "none"
    },
    orderTypeButton: {
      padding: "8px 18px",
      borderRadius: "10px",
      border: "2px solid rgba(255,255,255,0.3)",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      background: "rgba(255,255,255,0.08)",
      color: "#ffffff",
      transition: "all 0.3s ease"
    },
    orderTypeButtonActive: {
      padding: "8px 18px",
      borderRadius: "10px",
      border: "2px solid #f093fb",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "13px",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#ffffff",
      transition: "all 0.3s ease"
    },
    logContainer: {
      background: "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(10px)",
      color: "#98fb98",
      padding: "16px",
      borderRadius: "12px",
      height: "280px",
      overflowY: "auto" as const,
      fontFamily: "'Fira Code', 'Courier New', monospace",
      fontSize: "13px",
      border: "1px solid rgba(255,255,255,0.1)"
    },
    statusBadge: {
      padding: "6px 16px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "600",
      display: "inline-block",
      backdropFilter: "blur(5px)"
    },
    statCard: {
      background: "rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "16px",
      textAlign: "center" as const,
      backdropFilter: "blur(5px)",
      border: "1px solid rgba(255,255,255,0.1)"
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: "700", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🖨️ Premium Printer
            </h1>
            <p style={{ margin: "0", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
              {printCount} prints • Status: {status}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              ...styles.statusBadge,
              background: ready ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)",
              border: ready ? "1px solid #4caf50" : "1px solid #f44336",
              color: ready ? "#81c784" : "#ef9a9a"
            }}>
              {ready ? "● Ready" : "● Offline"}
            </span>
            {connected && (
              <span style={{
                ...styles.statusBadge,
                background: "rgba(33, 150, 243, 0.3)",
                border: "1px solid #42a5f5",
                color: "#64b5f6"
              }}>
                ● Connected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        {(["dashboard", "logs"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              ...styles.button,
              background: viewMode === mode 
                ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" 
                : "rgba(255,255,255,0.08)",
              color: viewMode === mode ? "#ffffff" : "rgba(255,255,255,0.8)",
              border: viewMode === mode ? "none" : "1px solid rgba(255,255,255,0.15)"
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* ========================================================== */}
      {/* DASHBOARD VIEW */}
      {/* ========================================================== */}
      {viewMode === "dashboard" && (
        <div>
          {/* Status Card */}
          <div style={styles.card}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>
              📊 Printer Status
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              <div style={styles.statCard}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Connected</div>
                <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "600", marginTop: "4px" }}>{connected ? "✅ Yes" : "❌ No"}</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ready</div>
                <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "600", marginTop: "4px" }}>{ready ? "✅ Yes" : "❌ No"}</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</div>
                <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "600", marginTop: "4px" }}>{status}</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Prints</div>
                <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "600", marginTop: "4px" }}>{printCount}</div>
              </div>
            </div>
            {error && (
              <div style={{ 
                color: "#ef9a9a", 
                marginTop: "12px", 
                fontSize: "14px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(244, 67, 54, 0.15)",
                border: "1px solid rgba(244, 67, 54, 0.3)"
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={styles.card}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>
              🎮 Controls
            </h3>

            {/* Order Type */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: "500" }}>
                Order Type:
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setOrderType("takeaway")}
                  style={orderType === "takeaway" ? styles.orderTypeButtonActive : styles.orderTypeButton}
                >
                  🛍️ Takeaway (৳)
                </button>
                <button
                  onClick={() => setOrderType("table")}
                  style={orderType === "table" ? styles.orderTypeButtonActive : styles.orderTypeButton}
                >
                  🍽️ Table ($)
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={initializePrinter}
                disabled={isPrinting}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isPrinting ? 0.6 : 1,
                  transform: isPrinting ? "scale(0.98)" : "scale(1)"
                }}
              >
                🔧 Init
              </button>
              <button
                onClick={checkStatus}
                disabled={isPrinting}
                style={{
                  ...styles.button,
                  opacity: isPrinting ? 0.6 : 1
                }}
              >
                📊 Status
              </button>
              <button
                onClick={printTest}
                disabled={!ready || isPrinting}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: (!ready || isPrinting) ? 0.5 : 1,
                  transform: (!ready || isPrinting) ? "scale(0.98)" : "scale(1)"
                }}
              >
                {isPrinting ? "⏳ Printing..." : "📄 Test Print"}
              </button>
              <button
                onClick={() => printReceipt(orderType)}
                disabled={!ready || isPrinting}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: (!ready || isPrinting) ? 0.5 : 1,
                  transform: (!ready || isPrinting) ? "scale(0.98)" : "scale(1)"
                }}
              >
                {isPrinting ? "⏳ Printing..." : `🧾 ${orderType === "table" ? "Table ($)" : "Takeaway (৳)"}`}
              </button>
              <button
                onClick={enableLogging}
                disabled={isPrinting}
                style={{
                  ...styles.button,
                  opacity: isPrinting ? 0.6 : 1
                }}
              >
                📝 Enable Logs
              </button>
              <button
                onClick={destroyPrinter}
                disabled={isPrinting}
                style={{
                  ...styles.button,
                  ...styles.dangerButton,
                  opacity: isPrinting ? 0.6 : 1
                }}
              >
                💥 Destroy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* LOGS VIEW */}
      {/* ========================================================== */}
      {viewMode === "logs" && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>📋 Activity Log</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setLogs([])} style={{ ...styles.button, fontSize: "12px", padding: "6px 14px" }}>
                Clear
              </button>
            </div>
          </div>
          <div ref={logContainerRef} style={styles.logContainer}>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: "100px", color: "rgba(255,255,255,0.3)" }}>
                No activity yet...
              </div>
            ) : (
              logs.map((line, i) => <div key={i} style={{ marginBottom: "2px" }}>{line}</div>)
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* NOTIFICATION */}
      {/* ========================================================== */}
      {notification && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          padding: "14px 24px",
          borderRadius: "14px",
          background: notification.type === "success" 
            ? "linear-gradient(135deg, #43a047, #66bb6a)" 
            : notification.type === "error" 
            ? "linear-gradient(135deg, #e53935, #ef5350)" 
            : "rgba(255,255,255,0.15)",
          backdropFilter: "blur(20px)",
          color: "#ffffff",
          boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
          zIndex: 1000,
          maxWidth: "420px",
          border: "1px solid rgba(255,255,255,0.15)",
          animation: "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {notification.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { 
            transform: translateX(100%) scale(0.9); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

export default App;