import { useEffect, useState } from "react";
import { createAuthClient } from "./auth.js";
import { founderConfiguration } from "./config.js";
import { fetchMetrics } from "./metrics.js";
import "./styles.css";

const defaultAuth = createAuthClient(founderConfiguration);
const currentMonth = new Date().toISOString().slice(0, 7);
const loopbackHosts = new Set(["localhost", "127.0.0.1"]);

function isLoopbackHost(hostname) {
  return loopbackHosts.has(hostname);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatTimestamp(value) {
  return `${new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;
}

function MetricCard({ label, metric }) {
  if (!metric) {
    return (
      <article className="metric-card metric-card-empty">
        <h2>{label}</h2>
        <p>No projection is recorded for this month.</p>
      </article>
    );
  }
  return (
    <article className="metric-card">
      <h2>{metric.label}</h2>
      <p className="metric-total">{formatNumber(metric.total)}</p>
      <dl>
        <div>
          <dt>Latest source event</dt>
          <dd>{formatTimestamp(metric.latestOccurredAt)}</dd>
        </div>
        <div>
          <dt>Projection processed</dt>
          <dd>{formatTimestamp(metric.processedAt)}</dd>
        </div>
      </dl>
    </article>
  );
}

const metricLabels = ["Consulting inbound leads", "Community mentor approvals"];

export default function App({ auth = defaultAuth, loadMetrics = fetchMetrics }) {
  const [accessToken, setAccessToken] = useState(() => auth.getAccessToken());
  const [month, setMonth] = useState(currentMonth);
  const [scenario, setScenario] = useState("timeline");
  const [refreshSequence, setRefreshSequence] = useState(0);
  const [rehearsalModule, setRehearsalModule] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [authError, setAuthError] = useState("");
  const configured = auth.configured;
  const rehearsalRequested = import.meta.env.DEV
    && import.meta.env.VITE_FOUNDER_UAT_REHEARSAL === "1"
    && isLoopbackHost(window.location.hostname);
  const rehearsalActive = rehearsalRequested && Boolean(rehearsalModule);
  const currentResult = reportResult?.month === month && reportResult?.scenario === scenario
    ? reportResult
    : null;
  const reportState = !accessToken && !rehearsalActive
    ? "idle"
    : currentResult?.status ?? "loading";
  const report = currentResult?.report ?? null;
  const reportError = currentResult?.error ?? "";

  useEffect(() => {
    if (!rehearsalRequested) return undefined;
    let active = true;
    import("./uat-rehearsal.js").then((module) => {
      if (active) setRehearsalModule(module);
    });
    return () => { active = false; };
  }, [rehearsalRequested]);

  useEffect(() => {
    if (rehearsalRequested) return undefined;
    let active = true;
    auth.completeSignIn(window.location.href)
      .then((token) => {
        if (active && token) {
          setReportResult(null);
          setAccessToken(token);
        }
      })
      .catch(() => {
        if (active) setAuthError("Sign-in could not be completed. Please try again.");
      });
    return () => { active = false; };
  }, [auth, rehearsalRequested]);

  useEffect(() => {
    if (!accessToken && !rehearsalActive) return undefined;
    if (rehearsalActive && !rehearsalModule) return undefined;
    const controller = new AbortController();
    const request = rehearsalActive
      ? rehearsalModule.loadRehearsalMetrics({ month, scenario, signal: controller.signal })
      : loadMetrics({
        apiUrl: founderConfiguration.apiUrl,
        accessToken,
        month,
        signal: controller.signal,
      });
    request.then((result) => {
      if (!controller.signal.aborted) {
        setReportResult({ month, scenario, status: "ready", report: result });
      }
    }).catch((error) => {
      if (error.name === "AbortError") return;
      if (!controller.signal.aborted) {
        if (error.statusCode === 401 && !rehearsalActive) {
          auth.clearSession();
          setReportResult(null);
          setAccessToken(null);
          setAuthError(error.message || "Your session expired. Sign in again.");
          return;
        }
        setReportResult({
          month,
          scenario,
          status: "error",
          error: error.message || "Reports are temporarily unavailable. Try again.",
        });
      }
    });
    return () => controller.abort();
  }, [accessToken, month, scenario, refreshSequence, loadMetrics, auth, rehearsalActive, rehearsalModule]);

  async function handleSignIn() {
    setAuthError("");
    try {
      await auth.beginSignIn();
    } catch (error) {
      setAuthError(error.message || "Sign-in could not be started.");
    }
  }

  function handleSignOut() {
    setReportResult(null);
    setAccessToken(null);
    auth.signOut();
  }

  const reportByKey = new Map((report?.metrics ?? []).map((metric) => [metric.key, metric]));
  return (
    <div className="founder-shell">
      <header className="founder-header">
        <a href="/" className="founder-wordmark">Roddy Tomlin</a>
        {accessToken && !rehearsalActive && <button className="button button-quiet" type="button" onClick={handleSignOut}>Sign out</button>}
      </header>
      <main className="founder-main">
        {!accessToken && !rehearsalActive ? (
          <section className="sign-in-card" aria-labelledby="founder-title">
            <p className="eyebrow">Private reporting</p>
            <h1 id="founder-title">Founder dashboard</h1>
            <p>Sign in to view monthly, aggregate reporting. Access is limited by the reporting API to the provisioned owner account.</p>
            {authError && <p role="alert" className="error-message">{authError}</p>}
            {!configured && <p role="status" className="config-message">Sign-in is not configured for this build.</p>}
            <button className="button" type="button" disabled={!configured} onClick={handleSignIn}>
              Sign in
            </button>
            <p className="security-note">Multi-factor authentication is required. No report data is included in this page until the API authorizes your request.</p>
          </section>
        ) : (
          <section aria-labelledby="founder-title">
            <div className="dashboard-heading">
              <div>
                <p className="eyebrow">Private reporting</p>
                <h1 id="founder-title">Founder dashboard</h1>
                {rehearsalActive && (
                  <p className="rehearsal-banner" role="note">
                    Synthetic local rehearsal — NOT auth, event-delivery, or DynamoDB certification. No network or live data is used.
                  </p>
                )}
              </div>
              <div className="report-controls">
                {rehearsalActive && (
                  <label className="month-field">
                    <span>Rehearsal response</span>
                    <select
                      value={scenario}
                      onChange={(event) => {
                        setReportResult(null);
                        setScenario(event.target.value);
                      }}
                    >
                      <option value="timeline">Synthetic monthly timeline</option>
                      <option value="expired">Expired session (401)</option>
                      <option value="error">Service unavailable (503)</option>
                      <option value="malformed">Malformed aggregate response</option>
                    </select>
                  </label>
                )}
                <label className="month-field">
                  <span>Reporting month</span>
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => {
                      setReportResult(null);
                      setMonth(event.target.value);
                    }}
                  />
                </label>
                <button
                  className="button button-refresh"
                  type="button"
                  disabled={reportState === "loading"}
                  onClick={() => {
                    setReportResult(null);
                    setRefreshSequence((sequence) => sequence + 1);
                  }}
                >
                  Refresh report
                </button>
              </div>
            </div>
            {reportState === "loading" && <p role="status" className="status-message">Loading authorized report…</p>}
            {reportState === "error" && <p role="alert" className="error-message">{reportError}</p>}
            {reportState === "ready" && report.metrics.length === 0 && (
              <p role="status" className="status-message">No reporting projections are recorded for {month}. This does not imply zero activity.</p>
            )}
            {reportState === "ready" && (
              <div className="metric-grid">
                <MetricCard
                  label={metricLabels[0]}
                  metric={reportByKey.get("consulting#inboundLeads")}
                />
                <MetricCard
                  label={metricLabels[1]}
                  metric={reportByKey.get("dotcom#mentorApprovals")}
                />
              </div>
            )}
            <p className="security-note">
              Only aggregate projections are displayed; source records and participant details are not available here.
              A missing projection is not a zero, and signed totals can reflect corrections.
            </p>
          </section>
        )}
      </main>
      <footer className="founder-footer">Founder reporting · private, owner-authorized access</footer>
    </div>
  );
}
