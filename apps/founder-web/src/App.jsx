import { useEffect, useState } from "react";
import { createAuthClient } from "./auth.js";
import { founderConfiguration } from "./config.js";
import { fetchMetrics } from "./metrics.js";
import "./styles.css";

const defaultAuth = createAuthClient(founderConfiguration);
const currentMonth = new Date().toISOString().slice(0, 7);

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
  const [reportResult, setReportResult] = useState(null);
  const [authError, setAuthError] = useState("");
  const configured = auth.configured;
  const currentResult = reportResult?.month === month ? reportResult : null;
  const reportState = !accessToken ? "idle" : currentResult?.status ?? "loading";
  const report = currentResult?.report ?? null;
  const reportError = currentResult?.error ?? "";

  useEffect(() => {
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
  }, [auth]);

  useEffect(() => {
    if (!accessToken) return undefined;
    const controller = new AbortController();
    loadMetrics({
      apiUrl: founderConfiguration.apiUrl,
      accessToken,
      month,
      signal: controller.signal,
    }).then((result) => {
      if (!controller.signal.aborted) {
        setReportResult({ month, status: "ready", report: result });
      }
    }).catch((error) => {
      if (error.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setReportResult({
          month,
          status: "error",
          error: error.message || "Reports are temporarily unavailable. Try again.",
        });
      }
    });
    return () => controller.abort();
  }, [accessToken, month, loadMetrics]);

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
        {accessToken && <button className="button button-quiet" type="button" onClick={handleSignOut}>Sign out</button>}
      </header>
      <main className="founder-main">
        {!accessToken ? (
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
              </div>
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
            <p className="security-note">Only aggregate projections are displayed. Source records and participant details are not available in this dashboard.</p>
          </section>
        )}
      </main>
      <footer className="founder-footer">Founder reporting · private, owner-authorized access</footer>
    </div>
  );
}
