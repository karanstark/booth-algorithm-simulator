# Quantum Booth Multiplier Puzzle

An interactive web-based puzzle where you build a **quantum circuit implementing Booth's multiplication algorithm** for 2-bit × 2-bit numbers.

## Booth's Algorithm on Quantum Gates

Booth's algorithm encodes the multiplier B into signed digits (+1, 0, −1), then performs conditional add/subtract of the multiplicand A at shifted positions. This is the same technique used in real CPU multipliers, mapped to reversible quantum gates (X, CX, CCX).

### Circuit Structure
- **12 qubits**: A (2), B (2), Product (4), Booth encoding (2), Carry (2)
- **~61 gates** for 3×3 (the hardest case)
- **5 phases**: Init → Booth encode → Process d₀ → Process d₁ → Process d₂

## Run

```bash
pip install flask
python app.py
# Landing: http://127.0.0.1:5000/
# Puzzle:  http://127.0.0.1:5000/puzzle
```

Run `python app.py` from this directory (the folder that contains `app.py`).

### Landing page (React + Vite)

The neural vortex hero lives in `../frontend` and builds into `static/landing/`. After editing the React app:

```bash
cd ../frontend
npm install
npm run build
```

Local UI dev (hot reload):

```bash
cd ../frontend
npm run dev
```

## Features
- Neural vortex WebGL landing page at `/` (React + TypeScript + Tailwind)
- Simulator at `/puzzle`: Framer Motion layout, WebGL lattice shader, glass panels; same circuit engine
- Drag-and-drop gate placement on SVG circuit grid
- Classical Booth digit breakdown panel
- Step-by-step hint system
- Full reference solution loader
- Interactive guided tour & SOP guide
- All 16 input combinations verified correct
