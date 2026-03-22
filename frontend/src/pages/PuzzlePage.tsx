import { motion } from "framer-motion";
import { useEffect, type CSSProperties } from "react";
import { SimulatorCircuitBackground } from "@/components/simulator-circuit-background";
import { SOP_INNER_HTML } from "./sop-html";

const spring = { type: "spring" as const, stiffness: 95, damping: 20, mass: 0.85 };

export function PuzzlePage() {
  useEffect(() => {
    document.body.classList.add("puzzle-sim-body");
    return () => document.body.classList.remove("puzzle-sim-body");
  }, []);

  useEffect(() => {
    let cancelled = false;
    function loadScript(src: string) {
      return new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    }
    void (async () => {
      try {
        await loadScript("/static/js/circuit.js");
        if (cancelled) return;
        window.initBoothCircuit?.();
        await loadScript("/static/js/tutorial.js");
        if (cancelled) return;
        window.initBoothTutorial?.();
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SimulatorCircuitBackground />
      <div className="relative z-[1] min-h-screen">
        <motion.header
          className="sim-top-bar"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
        >
          <motion.a href="/" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            ← Landing
          </motion.a>
          <span className="sim-badge">Booth multiplier · simulator</span>
        </motion.header>

        <div className="tutorial-overlay" id="tutorial-overlay">
          <div className="tutorial-backdrop" id="tutorial-backdrop" />
          <div className="tutorial-modal" id="tutorial-modal">
            <div className="tutorial-header">
              <div className="tutorial-step-indicator" id="tutorial-step-indicator" />
              <button type="button" className="tutorial-close" id="tutorial-close">
                &times;
              </button>
            </div>
            <div className="tutorial-icon" id="tutorial-icon" />
            <h2 className="tutorial-title" id="tutorial-title" />
            <p className="tutorial-body" id="tutorial-body" />
            <div className="tutorial-detail" id="tutorial-detail" />
            <div className="tutorial-footer">
              <button type="button" className="tutorial-btn tutorial-btn-secondary" id="tutorial-prev">
                &larr; Back
              </button>
              <button type="button" className="tutorial-btn tutorial-btn-skip" id="tutorial-skip">
                Skip Tour
              </button>
              <button type="button" className="tutorial-btn tutorial-btn-primary" id="tutorial-next">
                Next &rarr;
              </button>
            </div>
          </div>
        </div>

        <div className="sop-panel" id="sop-panel">
          <div className="sop-panel-header">
            <h3>Standard Operating Procedure</h3>
            <button type="button" className="sop-panel-close" id="sop-panel-close">
              &times;
            </button>
          </div>
          <div
            className="sop-panel-content"
            dangerouslySetInnerHTML={{ __html: SOP_INNER_HTML }}
          />
        </div>

        <div className="app-layout">
          <motion.aside
            className="left-panel sim-glass"
            id="left-panel"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.06 }}
          >
            <div className="panel-brand">
              <h1>&lang; Quantum Booth Multiplier &rang;</h1>
              <p id="subtitle">Booth: 11 &times; 11 = 1001 (3 &times; 3 = 9)</p>
            </div>

            <div className="panel-section">
              <div className="section-label">INPUTS</div>
              <div className="input-row">
                <span className="input-label" style={{ color: "var(--cyan)" }}>
                  A
                </span>
                <div className="bit-buttons" id="a-buttons">
                  <button type="button" data-val="0">
                    00
                  </button>
                  <button type="button" data-val="1">
                    01
                  </button>
                  <button type="button" data-val="2">
                    10
                  </button>
                  <button type="button" data-val="3" className="selected">
                    11
                  </button>
                </div>
              </div>
              <div className="input-row">
                <span className="input-label" style={{ color: "var(--purple)" }}>
                  B
                </span>
                <div className="bit-buttons" id="b-buttons">
                  <button type="button" data-val="0">
                    00
                  </button>
                  <button type="button" data-val="1">
                    01
                  </button>
                  <button type="button" data-val="2">
                    10
                  </button>
                  <button type="button" data-val="3" className="selected">
                    11
                  </button>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="section-label">GATE PALETTE</div>
              <div className="gate-palette" id="gate-palette">
                <button
                  type="button"
                  className="gate-btn"
                  data-gate="X"
                  draggable
                  style={{ "--gate-color": "var(--cyan)" } as CSSProperties}
                >
                  X<span className="gate-desc">Pauli-X</span>
                </button>
                <button
                  type="button"
                  className="gate-btn"
                  data-gate="CX"
                  draggable
                  style={{ "--gate-color": "var(--purple)" } as CSSProperties}
                >
                  CX<span className="gate-desc">CNOT</span>
                </button>
                <button
                  type="button"
                  className="gate-btn"
                  data-gate="CCX"
                  draggable
                  style={{ "--gate-color": "var(--pink)" } as CSSProperties}
                >
                  CCX<span className="gate-desc">Toffoli</span>
                </button>
                <button
                  type="button"
                  className="gate-btn eraser-btn"
                  data-gate="eraser"
                  style={{ "--gate-color": "var(--orange)" } as CSSProperties}
                >
                  &times;<span className="gate-desc">Eraser</span>
                </button>
              </div>
            </div>

            <div className="panel-footer-btns">
              <button type="button" className="header-btn" id="btn-tour">
                &#9654; Tour
              </button>
              <button type="button" className="header-btn" id="btn-sop">
                &#128203; SOP
              </button>
            </div>
          </motion.aside>

          <motion.main
            className="center-area"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.1 }}
          >
            <div className="instruction-bar" id="instruction">
              Select a gate from the palette, then click on the grid to place it. Click existing gates to
              delete.
            </div>

            <motion.div
              className="circuit-container sim-glass"
              id="circuit-container"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.12 }}
            >
              <div className="circuit-header">
                <span>Circuit Grid</span>
                <span id="gate-count">0 gates placed</span>
              </div>
              <div className="circuit-scroll">
                <svg id="circuit-svg" xmlns="http://www.w3.org/2000/svg" />
              </div>
              <div className="circuit-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--cyan)" }} />
                  A
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--purple)" }} />
                  B
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--green)" }} />
                  P
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--yellow)" }} />
                  E
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--orange)" }} />
                  C
                </div>
              </div>
            </motion.div>

            <div className="output-cards">
              <div className="panel-card result-card sim-glass" id="result-panel" style={{ display: "none" }}>
                <div className="card-title">SIMULATION RESULT</div>
                <div id="result-content" />
                <div id="result-verdict" className="result-verdict" />
              </div>
              <div className="panel-card hint-card sim-glass" id="hint-panel" style={{ display: "none" }}>
                <div className="card-title">NEXT GATE NEEDED</div>
                <div id="hint-content" />
              </div>
            </div>
          </motion.main>

          <motion.aside
            className="right-panel sim-glass"
            id="right-panel"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.14 }}
          >
            <div className="panel-section">
              <div className="section-label">TARGET</div>
              <div className="target-display">
                <span id="target-decimal" className="target-big">
                  3 &times; 3 = 9
                </span>
                <span id="target-binary" className="target-small">
                  11 &times; 11 = 1001
                </span>
              </div>
            </div>

            <div className="panel-section">
              <div className="section-label">BOOTH DIGITS</div>
              <div id="classical-hint" className="classical-content" />
            </div>

            <div className="panel-section">
              <div className="section-label">CONTROLS</div>
              <button type="button" className="btn-check" id="btn-check">
                &zwnj;&#9889; Check Circuit
              </button>
              <div className="btn-row">
                <button type="button" className="btn-action btn-clear" id="btn-clear">
                  Clear All
                </button>
                <button type="button" className="btn-action btn-hint" id="btn-hint">
                  Show Hint
                </button>
              </div>
              <button type="button" className="btn-solution" id="btn-solution">
                Load Solution
              </button>
            </div>

            <div className="panel-section">
              <div className="section-label">METRICS</div>
              <div className="metrics-grid">
                <span className="metric-label">Toffoli (CCX)</span>
                <span className="metric-value" id="m-ccx" style={{ color: "var(--pink)" }}>
                  0
                </span>
                <span className="metric-label">CNOT (CX)</span>
                <span className="metric-value" id="m-cx" style={{ color: "var(--purple)" }}>
                  0
                </span>
                <span className="metric-label">Pauli-X</span>
                <span className="metric-value" id="m-x" style={{ color: "var(--cyan)" }}>
                  0
                </span>
                <span className="metric-label">Total gates</span>
                <span className="metric-value" id="m-total">
                  0
                </span>
              </div>
              <div className="qubit-count">
                <span>Qubits</span>
                <span className="qubit-number">12</span>
              </div>
              <div className="qubit-breakdown">2A + 2B + 4P + 2E + 2C</div>
            </div>
          </motion.aside>
        </div>
      </div>
    </>
  );
}
