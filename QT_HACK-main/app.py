"""Flask backend for the Quantum Booth Multiplier Puzzle."""
import os

from flask import Flask, jsonify, request, send_from_directory

from simulator import Gate, build_reference, check_solution, get_next_hint

app = Flask(__name__)

def gates_from_json(data):
    return [Gate(g.get("id",i), g["type"], g["col"], g["target"], g.get("controls",[])) for i,g in enumerate(data)]

@app.route("/")
def landing():
    return send_from_directory(
        os.path.join(app.root_path, "static", "landing"),
        "index.html",
    )


@app.route("/puzzle")
def puzzle():
    return send_from_directory(
        os.path.join(app.root_path, "static", "landing"),
        "puzzle.html",
    )

@app.route("/api/check", methods=["POST"])
def api_check():
    d = request.json; a,b = d.get("a",0), d.get("b",0)
    r = check_solution(gates_from_json(d.get("gates",[])), a, b)
    return jsonify({"correct":r.correct,"a_val":r.a_val,"b_val":r.b_val,
                    "p_val":r.p_val,"c_val":r.c_val,"e_val":r.e_val,
                    "expected":r.expected_product,"state":r.state})

@app.route("/api/hint", methods=["POST"])
def api_hint():
    d = request.json; a,b = d.get("a",0), d.get("b",0)
    h = get_next_hint(gates_from_json(d.get("gates",[])), a, b)
    if h: return jsonify({"found":True,"type":h.gate_type,"col":h.col,"target":h.target,"controls":h.controls})
    return jsonify({"found":False})

@app.route("/api/solution", methods=["POST"])
def api_solution():
    d = request.json; a,b = d.get("a",0), d.get("b",0)
    return jsonify({"gates":[{"type":g.gate_type,"col":g.col,"target":g.target,"controls":g.controls} for g in build_reference(a,b)]})

if __name__ == "__main__": app.run(debug=True, port=5000)
