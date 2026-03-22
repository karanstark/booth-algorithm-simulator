"""
simulator.py — Booth's Algorithm Quantum Multiplier.
12 qubits: a0(0),a1(1),b0(2),b1(3),p0(4),p1(5),p2(6),p3(7),e0(8),e1(9),c0(10),c1(11)
"""
from dataclasses import dataclass, field
from typing import List, Optional

QUBIT_NAMES = ["a₀","a₁","b₀","b₁","p₀","p₁","p₂","p₃","e₀","e₁","c₀","c₁"]
NUM_QUBITS = 12
REGISTER_MAP = {"A":(0,2),"B":(2,4),"P":(4,8),"E":(8,10),"C":(10,12)}
QUBIT_GROUPS = [
    {"label":"A (multiplicand)","indices":[0,1],"color":"#00e5ff"},
    {"label":"B (multiplier)","indices":[2,3],"color":"#b388ff"},
    {"label":"P (product)","indices":[4,5,6,7],"color":"#69f0ae"},
    {"label":"E (Booth enc.)","indices":[8,9],"color":"#ffd740"},
    {"label":"C (carry)","indices":[10,11],"color":"#ffab40"},
]

def qubit_color(i):
    for g in QUBIT_GROUPS:
        if i in g["indices"]: return g["color"]
    return "#888"

@dataclass
class Gate:
    gate_id: int; gate_type: str; col: int; target: int
    controls: List[int] = field(default_factory=list)
    def involved_qubits(self): return self.controls + [self.target]

def simulate(gates):
    state = [0]*NUM_QUBITS
    for g in sorted(gates, key=lambda g:(g.col, g.gate_id)):
        if g.gate_type=="X": state[g.target]^=1
        elif g.gate_type=="CX":
            if len(g.controls)>=1 and state[g.controls[0]]: state[g.target]^=1
        elif g.gate_type=="CCX":
            if len(g.controls)>=2 and state[g.controls[0]] and state[g.controls[1]]: state[g.target]^=1
    return state

def read_reg(state, name):
    lo,hi = REGISTER_MAP[name]; v=0
    for i,idx in enumerate(range(lo,hi)): v|=(state[idx]<<i)
    return v

@dataclass
class CheckResult:
    state:list; a_val:int; b_val:int; p_val:int; c_val:int; e_val:int
    expected_product:int; correct:bool

def check_solution(gates, a, b):
    state = simulate(gates)
    a_val,b_val,p_val = read_reg(state,"A"), read_reg(state,"B"), read_reg(state,"P")
    c_val,e_val = read_reg(state,"C"), read_reg(state,"E")
    correct = (p_val==a*b) and (a_val==a) and (b_val==b)
    return CheckResult(state,a_val,b_val,p_val,c_val,e_val,a*b,correct)

def build_reference(a, b):
    gates=[]; gid=[0]
    def g(t,c,tgt,ctrls=None):
        gates.append(Gate(gid[0],t,c,tgt,list(ctrls or []))); gid[0]+=1

    a0,a1,b0,b1 = a&1,(a>>1)&1,b&1,(b>>1)&1

    # PHASE 0: Init
    col=0
    if a0: g("X",col,0)
    if a1: g("X",col,1)
    if b0: g("X",col,2)
    if b1: g("X",col,3)

    # PHASE 1: Booth Encode
    g("X",2,3);    g("CCX",2,8,[3,2]);  g("X",2,3)
    g("X",3,2);    g("CCX",3,9,[3,2]);  g("X",3,2)

    # PHASE 2: d0=-b0 (subtract A at pos 0)
    g("CX",4,0,[2]); g("CX",4,1,[2])           # negate A
    g("CCX",5,4,[0,2]); g("CCX",5,5,[1,2])      # add ~A
    g("CX",5,6,[2]); g("CX",5,7,[2])            # sign ext
    g("CX",6,4,[2])                               # +1
    g("CCX",6,10,[0,2])                            # c0=carry from bit 0
    g("CX",7,5,[10])                               # p1 ^= c0
    g("CCX",7,11,[1,10])                           # c1=carry from bit 1
    g("CX",7,6,[11]); g("CX",7,7,[11])           # p2,p3 ^= c1
    g("CCX",8,11,[1,10]); g("CCX",8,10,[0,2])    # uncompute carries
    g("CX",9,0,[2]); g("CX",9,1,[2])             # restore A

    # PHASE 3A: d1 add (controlled e0) — add A at pos 1
    # Step 1: addend for p1 and carry from p1
    g("CCX",10,10,[0,8])     # c0 = a0·e0
    g("CCX",10,11,[10,5])    # c1 = c0·p1 (carry from p1)
    # Step 2: sum at p1
    g("CX",11,5,[10])        # p1 ^= c0
    # Step 3: switch c0 to addend for p2
    g("CCX",11,10,[0,8])     # uncompute c0 (c0=0)
    g("CCX",11,10,[1,8])     # c0 = a1·e0 (addend for p2)
    # Step 4: carry from p2→p3 (before modifying p2)
    g("CCX",12,7,[6,10])     # p3 ^= p2·(a1·e0)
    g("CCX",12,7,[6,11])     # p3 ^= p2·carry_from_p1
    g("CCX",12,7,[10,11])    # p3 ^= (a1·e0)·carry
    # Step 5: sum at p2
    g("CX",13,6,[10])        # p2 ^= a1·e0
    g("CX",13,6,[11])        # p2 ^= carry from p1
    # Step 6: uncompute c0 (a1·e0)
    g("CCX",14,10,[1,8])     # c0=0
    # Step 7: uncompute c1 (restore p1_old, undo c1, redo p1)
    g("CCX",14,10,[0,8])     # c0=a0·e0
    g("CX",14,5,[10])        # p1=p1_old
    g("CCX",14,11,[10,5])    # c1=0
    g("CX",15,5,[10])        # p1=p1_new
    g("CCX",15,10,[0,8])     # c0=0

    # PHASE 3B: d1 sub (controlled e1) — subtract A at pos 1
    g("CX",16,0,[9]); g("CX",16,1,[9])           # negate A
    g("CCX",17,5,[0,9]); g("CCX",17,6,[1,9])     # add ~A at pos 1
    g("CX",17,7,[9])                               # sign ext
    g("CX",18,5,[9])                               # +1 at pos 1
    g("CCX",18,10,[0,9])                            # c0=carry
    g("CX",19,6,[10])                               # p2 ^= c0
    g("CCX",19,11,[1,10])                           # c1=carry
    g("CX",19,7,[11])                               # p3 ^= c1
    g("CCX",20,11,[1,10]); g("CCX",20,10,[0,9])   # uncompute carries
    g("CX",21,0,[9]); g("CX",21,1,[9])            # restore A

    # PHASE 4: d2=b1 (add A at pos 2)
    g("CCX",22,10,[0,3])     # c0 = a0·b1
    g("CCX",22,11,[10,6])    # c1 = c0·p2 (carry)
    g("CX",22,7,[11])        # p3 ^= carry
    g("CX",23,6,[10])        # p2 ^= a0·b1
    g("CCX",23,7,[1,3])      # p3 ^= a1·b1

    return gates

def get_next_hint(placed, a, b):
    ref = build_reference(a, b)
    used = [False]*len(placed)
    for rg in ref:
        matched = False
        for i,pg in enumerate(placed):
            if not used[i] and pg.gate_type==rg.gate_type and pg.col==rg.col and pg.target==rg.target and sorted(pg.controls)==sorted(rg.controls):
                used[i] = True; matched = True; break
        if not matched: return rg
    return None

if __name__=="__main__":
    print("Testing Booth multiplier:")
    ok=True
    for a in range(4):
        for b in range(4):
            ref=build_reference(a,b); r=check_solution(ref,a,b)
            s="✓" if r.correct else "✗"
            if not r.correct: ok=False
            print(f"  {a}×{b}={a*b}: P={r.p_val} A={r.a_val} B={r.b_val} E={r.e_val} C={r.c_val} {s}"
                  f"{'  ← WRONG (expected '+str(r.expected_product)+')' if not r.correct else ''}")
    print(f"\nAll pass: {ok}")
    ref33=build_reference(3,3)
    print(f"Gates for 3×3: {len(ref33)}")
    ref11=build_reference(1,1)
    print(f"Gates for 1×1: {len(ref11)}")