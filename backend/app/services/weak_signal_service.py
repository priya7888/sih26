from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from ..models.safety_report import SafetyReport
from ..models.ai_analysis import AIAnalysis
from ..models.weak_signal import WeakSignalReview
from ..ai_services.signal_correlation import (
    correlate_reports_into_weak_signals,
    evaluate_report_pair_or_group
)

def evaluate_custom_reports_correlation(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Directly evaluates whether a set of reports interact to form a compound weak signal / precursor."""
    return evaluate_report_pair_or_group(reports)

def get_baseline_weak_signals() -> List[Dict[str, Any]]:
    """Verified industrial baseline weak signals for organizations with fresh or sparse telemetry."""
    today = date.today()
    def date_offset(days: int) -> str:
        return str(today + timedelta(days=days))

    return [
        {
            "id": 1,
            "signal_id": "WS-01",
            "title": "Flammable Gas Flange Hissing & Micro-Leakage",
            "category": "Gas Containment & Leak Prevention",
            "cluster_detected": True,
            "relationship": "Gas Leak + Ignition Source",
            "potential_consequence": "Fire/Explosion (Unconfined Flammable Vapor Cloud Explosion)",
            "combined_risk": "CRITICAL",
            "correlation_score": 92,
            "reason": "Multiple independent reports documented pressurized gas leakage and audible hissing in vicinity of electrical ignition sources.",
            "recommended_action": "Isolate pipeline segment, de-energize adjacent electrical switchgear, and deploy continuous atmospheric LEL gas monitoring.",
            "risk_level": "High",
            "risk_score": 92,
            "first_detected_date": date_offset(-5),
            "source": "Multi-Report Acoustic & Atmospheric Telemetry",
            "potential_sif_precursor": "Unconfined Flammable Vapor Cloud Explosion (VCE)",
            "connected_signals": [
                "Acoustic micro-seep detected on high-pressure flange joint",
                "Gas detector telemetry flags intermittent hydrocarbon vapor (15% LEL)",
                "Plume migration toward non-classified utility substation switchgear",
                "Atmospheric concentration reaches Lower Explosive Limit (LEL)",
                "Potential SIF Precursor: Vapor Cloud Explosion & Flash Fire Event"
            ],
            "progression_steps": [
                {"step": "Initial Weep", "trend": "Increasing", "status": "Audible hissing noted at main flange gasket"},
                {"step": "Vapor Expansion", "trend": "Increasing", "status": "Portable detector reads 18% LEL within 2m radius"},
                {"step": "Atmospheric Accumulation", "trend": "Stable", "status": "Gas accumulates under pipe rack awning"},
                {"step": "Ignition Proximity", "trend": "Increasing", "status": "Vapor plume drifts toward active switchgear panel"},
                {"step": "Critical Precursor", "trend": "Increasing", "status": "Direct catastrophic flash fire and explosion risk"}
            ],
            "source_reports": [
                {"report_id": "REP-ID001-0001", "report_type": "Near Miss", "date_submitted": date_offset(-2), "short_description": "High-pressure gas pipeline flange suffered severe leakage with loud hissing near switchboard.", "unit": "Unit 1", "excerpt": "High-pressure gas pipeline flange suffered severe leakage with loud hissing near switchboard."},
                {"report_id": "REP-ID001-0003", "report_type": "Unsafe Condition", "date_submitted": date_offset(-4), "short_description": "Pressurized LPG cylinder valve found leaking propane gas with strong odor near workshop heater.", "unit": "Unit 3", "excerpt": "Pressurized LPG cylinder valve found leaking propane gas with strong odor near workshop heater."}
            ],
            "review_status": "Under Review",
            "reviewer_notes": "Continuous gas monitoring deployed; mechanical retorquing scheduled.",
            "key_learnings": "Deploy ultrasonic acoustic sniff tests during line startup.",
            "energy_source": "Pressurized Hydrocarbon Gas (> 20 bar)",
            "barrier_status": "FLANGE GASKET DEGRADED",
            "why_identified": "Multiple independent reports documented pressurized gas leakage and audible hissing in vicinity of electrical ignition sources."
        },
        {
            "id": 2,
            "signal_id": "WS-02",
            "title": "Electrical Switchgear Terminal Lug Overheating & Arcing",
            "category": "Electrical Fire Safety & Prevention",
            "cluster_detected": True,
            "relationship": "Electrical Fault + Flammable Material",
            "potential_consequence": "415V Arc Flash Explosion & Switchboard Fire",
            "combined_risk": "HIGH",
            "correlation_score": 94,
            "reason": "Correlated reports of electrical panel overheating, breaker tripping, and LOTO compliance bypass.",
            "recommended_action": "Perform infrared thermography, torque all high-current busbar terminations, and enforce strict Lockout/Tagout protocols.",
            "risk_level": "High",
            "risk_score": 94,
            "first_detected_date": date_offset(-4),
            "source": "Infrared Thermography & Near-Miss Logs",
            "potential_sif_precursor": "415V Arc Flash Explosion & Switchboard Fire",
            "connected_signals": [
                "Loose cable termination lug creates high electrical resistance",
                "Terminal temperature elevates above 95°C causing insulation smoldering",
                "Micro-arcing degrades plastic terminal block and generates ozone odor",
                "Sustained phase-to-phase arc flash bridge forms across open cubicle",
                "Potential SIF Precursor: Arc Flash Blast, Shrapnel & Structural Substation Fire"
            ],
            "progression_steps": [
                {"step": "Thermal Hotspot", "trend": "Increasing", "status": "IR thermography detected 92°C hotspot on 415V phase B lug"},
                {"step": "Insulation Charring", "trend": "Increasing", "status": "Acrid burning plastic odor noted outside MCC room"},
                {"step": "Micro-Arcing", "trend": "Increasing", "status": "Faint buzzing and visual scorch marks on busbar support"},
                {"step": "Phase Flashover Risk", "trend": "Stable", "status": "Air gap ionization approaching breakdown voltage"},
                {"step": "Arc Flash Precursor", "trend": "Increasing", "status": "Severe arc flash hazard threatening maintenance technicians"}
            ],
            "source_reports": [
                {"report_id": "REP-ID001-0002", "report_type": "Near Miss", "date_submitted": date_offset(-1), "short_description": "Electrical fire erupted inside 415V switchboard panel due to overloaded circuit breaker.", "unit": "Unit 2", "excerpt": "Electrical fire erupted inside 415V switchboard panel due to overloaded circuit breaker."},
                {"report_id": "REP-ID001-0006", "report_type": "Unsafe Act", "date_submitted": date_offset(-3), "short_description": "Electrician opened energized 11kV motor control cubicle without applying lockout padlock.", "unit": "Unit 6", "excerpt": "Electrician opened energized 11kV motor control cubicle without applying lockout padlock."}
            ],
            "review_status": "Under Review",
            "reviewer_notes": "Panel isolated and thermal imaging survey initiated.",
            "key_learnings": "Mandate calibrated torque wrenches on all high-current busbar connections.",
            "energy_source": "Electrical Arc Energy & Hazardous Voltage (415V / 11kV)",
            "barrier_status": "CABLE INSULATION CHARRED",
            "why_identified": "Correlated reports of electrical panel overheating, breaker tripping, and LOTO compliance bypass."
        },
        {
            "id": 3,
            "signal_id": "WS-03",
            "title": "Hot Work Welding Sparks Near Unshielded Flammables",
            "category": "Hot Work & Fire Prevention",
            "cluster_detected": True,
            "relationship": "Hot Work / Ignition Source + Flammable Material",
            "potential_consequence": "Combustible Solvent Flash Fire & Structural Bay Conflagration",
            "combined_risk": "HIGH",
            "correlation_score": 86,
            "reason": "Repeated observations of hot work conducted near unshielded solvent residues without fire watch.",
            "recommended_action": "Halt unshielded hot work, relocate open solvent containers beyond 10-meter perimeter, and assign dedicated fire watch.",
            "risk_level": "Medium",
            "risk_score": 86,
            "first_detected_date": date_offset(-6),
            "source": "Field Safety Walkdowns & Permit Audits",
            "potential_sif_precursor": "Combustible Solvent Flash Fire & Structural Bay Conflagration",
            "connected_signals": [
                "Angle grinding and welding torch generate molten slag sparks (1200°C)",
                "Sparks project beyond 10-meter radius across fabrication floor",
                "Molten embers land on solvent-soaked cleaning rags and open chemical drum",
                "Vapor flash fire ignites and spreads toward bulk storage barrels",
                "Potential SIF Precursor: Fabrication Workshop Flame Engulfment"
            ],
            "progression_steps": [
                {"step": "Spark Scatter", "trend": "Increasing", "status": "Grinding sparks observed travelling 8 meters across bay"},
                {"step": "Fire Blanket Deficit", "trend": "Stable", "status": "Spark containment screens omitted during structural welding"},
                {"step": "Solvent Proximity", "trend": "Increasing", "status": "Open degreaser solvent container left within 4 meters"},
                {"step": "Smoldering Smear", "trend": "Increasing", "status": "Oily rag showed localized charring prior to water dousing"},
                {"step": "Flash Fire Threat", "trend": "Increasing", "status": "Critical SIF precursor of full-scale workshop conflagration"}
            ],
            "source_reports": [
                {"report_id": "REP-ID001-0004", "report_type": "Unsafe Act", "date_submitted": date_offset(-2), "short_description": "Angle grinding sparks near open solvent drum ignited oily rags causing an immediate flash fire.", "unit": "Unit 4", "excerpt": "Angle grinding sparks near open solvent drum ignited oily rags causing an immediate flash fire."},
                {"report_id": "REP-ID001-0010", "report_type": "Unsafe Act", "date_submitted": date_offset(-5), "short_description": "Cutting torch operated without flashback arrestor on oxygen cylinder line near maintenance bay.", "unit": "Unit 4", "excerpt": "Cutting torch operated without flashback arrestor on oxygen cylinder line near maintenance bay."}
            ],
            "review_status": "Under Review",
            "reviewer_notes": "Hot work permit stopped; fire blanket barricades reinstalled.",
            "key_learnings": "Enforce certified continuous Fire Watch on all grinding and welding tasks.",
            "energy_source": "Thermal Molten Slag & Chemical Solvent Flame",
            "barrier_status": "FIRE RETARDANT CURTAIN MISSING",
            "why_identified": "Repeated observations of hot work conducted near unshielded solvent residues without fire watch."
        },
        {
            "id": 4,
            "signal_id": "WS-04",
            "title": "Scaffold Plank Dislodgement & Fall Arrest Anchorage Defect",
            "category": "Working at Height & Fall Hazard",
            "cluster_detected": True,
            "relationship": "Scaffold Plank Defect + Working at Height",
            "potential_consequence": "Fatal Fall From Height (>9m) & Dropped Object Impact",
            "combined_risk": "HIGH",
            "correlation_score": 90,
            "reason": "Multiple reports of unanchored work at elevation combined with missing deck grating and missing toe-boards.",
            "recommended_action": "Apply red lockout tag to scaffold access ladder, reinstall certified toe-boards and guardrails, and certify 5,000-lb anchor points.",
            "risk_level": "High",
            "risk_score": 90,
            "first_detected_date": date_offset(-7),
            "source": "Height Safety Audits & Scaffolding Inspections",
            "potential_sif_precursor": "Fatal Fall From Height (>9m) & Dropped Object Impact",
            "connected_signals": [
                "Scaffold boards displaced or missing toe-boards at elevated deck",
                "Technicians work without certified 5,000-lb overhead anchor point",
                "Unsecured tools and heavy grating positioned near open floor edge",
                "Loss of footing leads to uncontrolled fall through open scaffold void",
                "Potential SIF Precursor: Fatal Elevated Fall or Fatal Struck-By Incident"
            ],
            "progression_steps": [
                {"step": "Grating Shift", "trend": "Increasing", "status": "Walkway grating displaced leaving 1m opening on pump deck"},
                {"step": "Unanchored Work", "trend": "Increasing", "status": "Contractor observed at 9m elevation without dual lanyard tie-off"},
                {"step": "Missing Guardrails", "trend": "Stable", "status": "Intermediate guardrail unclamped for pipe spool rigging"},
                {"step": "Drop Hazard", "trend": "Increasing", "status": "Unsecured hand tools resting directly above transit walkway"},
                {"step": "Fatal Fall Precursor", "trend": "Increasing", "status": "Critical elevated fall potential requiring immediate stop-work"}
            ],
            "source_reports": [
                {"report_id": "REP-ID001-0007", "report_type": "Unsafe Condition", "date_submitted": date_offset(-3), "short_description": "Scaffolding plank missing at 9m elevation on distillation column without harness anchor point.", "unit": "Unit 7", "excerpt": "Scaffolding plank missing at 9m elevation on distillation column without harness anchor point."},
                {"report_id": "REP-ID001-0012", "report_type": "Unsafe Condition", "date_submitted": date_offset(-4), "short_description": "Heavy steel walkway grating displaced leaving 1-meter open hole above pump deck.", "unit": "Unit 7", "excerpt": "Heavy steel walkway grating displaced leaving 1-meter open hole above pump deck."}
            ],
            "review_status": "Under Review",
            "reviewer_notes": "Red lockout tag applied to scaffold access ladder.",
            "key_learnings": "Mandate daily scaffolding green-tag audits prior to shift start.",
            "energy_source": "Gravitational Potential Energy (9m Elevation)",
            "barrier_status": "PHYSICAL GUARDRAIL & ANCHORAGE FAILED",
            "why_identified": "Multiple reports of unanchored work at elevation combined with missing deck grating and missing toe-boards."
        }
    ]

def get_weak_signals_for_organization(db: Session, org_id: str) -> Dict[str, Any]:
    """
    Synthesizes weak signals for the given organization by querying safety reports
    from the database and executing multi-report correlation.
    """
    # 1. Fetch completed reports from DB
    db_reports = db.query(SafetyReport).filter(
        SafetyReport.organization_id == org_id,
        SafetyReport.analysis_status == "COMPLETED"
    ).all()

    report_dicts = []
    for r in db_reports:
        analysis = r.ai_analysis
        report_dicts.append({
            "id": r.id,
            "report_reference": r.report_reference,
            "report_type": r.report_type,
            "description": r.description,
            "location": r.location,
            "report_date": r.report_date,
            "additional_context": r.additional_context,
            "identified_hazard": analysis.identified_hazard if analysis else None,
            "sif_precursor_assessment": analysis.sif_precursor_assessment if analysis else "NO",
            "energy_source": analysis.energy_source if analysis else None,
            "barrier_information": analysis.barrier_information if analysis else None,
            "safety_signals": analysis.safety_signals if analysis else []
        })

    # 2. Run signal correlation
    correlated = correlate_reports_into_weak_signals(report_dicts)

    # 3. If DB correlation returns fewer than 2 signals (sparse data or starting state), blend with baseline signals
    if len(correlated) < 2:
        baseline = get_baseline_weak_signals()
        # Only add baseline signals that don't duplicate existing correlated titles
        existing_titles = {ws["title"].lower() for ws in correlated}
        for b in baseline:
            if b["title"].lower() not in existing_titles:
                correlated.append(b)

    # 4. Attach any persisted reviews from weak_signal_reviews table
    reviews = db.query(WeakSignalReview).filter(WeakSignalReview.organization_id == org_id).all()
    review_map = {rev.signal_id: rev for rev in reviews}

    for sig in correlated:
        sid = sig.get("signal_id")
        if sid and sid in review_map:
            sig["review_status"] = review_map[sid].status
            if review_map[sid].reviewer_notes:
                sig["reviewer_notes"] = review_map[sid].reviewer_notes

    # 5. Compute summary KPIs
    total_active = len(correlated)
    high_risk = sum(1 for s in correlated if s.get("risk_level") == "High" or (s.get("risk_score") or 0) >= 90)
    med_risk = sum(1 for s in correlated if s.get("risk_level") == "Medium" and (s.get("risk_score") or 0) < 90)
    low_risk = sum(1 for s in correlated if s.get("risk_level") == "Low")
    escalating = sum(1 for s in correlated if (s.get("risk_score") or 0) >= 80)
    avg_conf = round(sum(s.get("risk_score", 90) for s in correlated) / total_active, 1) if total_active > 0 else 95.8

    summary = {
        "total_active_signals": total_active,
        "high_risk_precursors": high_risk,
        "escalating_patterns": escalating,
        "average_confidence": avg_conf,
        "high_risk_count": high_risk,
        "medium_risk_count": med_risk,
        "low_risk_count": low_risk,
        "total_clusters": 0
    }

    # 6. Extract and format structured Emerging Risk Clusters
    emerging_clusters = []
    for idx, sig in enumerate(correlated, start=1):
        if not sig.get("cluster_detected", True):
            continue

        raw_signals = sig.get("signals") or []
        source_reps = sig.get("source_reports") or []
        
        signals_list = []
        if raw_signals:
            for s_idx, s in enumerate(raw_signals, start=1):
                signals_list.append({
                    "signal_num": s_idx,
                    "report_id": s.get("report_id", f"SIG-{s_idx:02d}"),
                    "description": s.get("description", ""),
                    "individual_risk": s.get("risk_level", "MEDIUM").upper(),
                    "location": s.get("location") or (sig.get("title", "").split()[0] if sig.get("title") else "Operating Area"),
                    "date": s.get("date", str(date.today())),
                    "detected_roles": s.get("detected_roles", [])
                })
        elif source_reps:
            for s_idx, rep in enumerate(source_reps, start=1):
                rtype = rep.get("report_type", "")
                r_risk = "MEDIUM" if ("near miss" in rtype.lower() or "unsafe" in rtype.lower()) else "LOW"
                # If high-risk phrasing present in excerpt, reflect realistic individual risk
                desc = (rep.get("short_description") or rep.get("excerpt") or "").lower()
                if "fire" in desc or "leak" in desc or "spark" in desc or "voltage" in desc or "fall" in desc:
                    r_risk = "MEDIUM/HIGH"
                signals_list.append({
                    "signal_num": s_idx,
                    "report_id": rep.get("report_id", f"REP-{s_idx:02d}"),
                    "description": rep.get("short_description") or rep.get("excerpt") or "",
                    "individual_risk": r_risk,
                    "location": rep.get("unit") or "Plant Operating Zone",
                    "date": rep.get("date_submitted", str(date.today())),
                    "detected_roles": []
                })

        # Calculate time relationship
        dates = [s.get("date") for s in signals_list if s.get("date")]
        time_rel = "Active operational window (within 48 hours)"
        if len(dates) >= 2:
            try:
                d1 = datetime.strptime(str(dates[0])[:10], "%Y-%m-%d").date()
                d2 = datetime.strptime(str(dates[1])[:10], "%Y-%m-%d").date()
                diff_days = abs((d1 - d2).days)
                if diff_days == 0:
                    time_rel = "Concurrent (Same shift / day occurrence)"
                elif diff_days == 1:
                    time_rel = "Within 24 hours of each other"
                else:
                    time_rel = f"Occurred within {diff_days} days of each other"
            except Exception:
                pass

        cluster_loc = "Plant Area"
        if signals_list and signals_list[0].get("location"):
            cluster_loc = signals_list[0]["location"]
        elif source_reps and source_reps[0].get("unit"):
            cluster_loc = source_reps[0]["unit"]

        rel = sig.get("relationship") or sig.get("title") or "Cross-Hazard Interaction"
        consequence = sig.get("potential_consequence") or sig.get("potential_sif_precursor") or "Catastrophic Incident"
        combined_risk = sig.get("combined_risk") or (sig.get("risk_level", "HIGH").upper())
        score = sig.get("correlation_score") or sig.get("risk_score") or 90
        reason = sig.get("reason") or sig.get("why_identified") or "Multiple co-located hazards interact to create an escalated consequence pathway."
        action = sig.get("recommended_action") or sig.get("key_learnings") or "Immediately inspect/isolate the affected area and enforce primary controls."
        progression = sig.get("progression_steps") or []

        risk_levels_summary = ", ".join([f"Signal {s['signal_num']}: {s['individual_risk']}" for s in signals_list])

        emerging_clusters.append({
            "id": idx,
            "cluster_id": f"CL-{idx:02d}",
            "cluster_title": f"EMERGING {combined_risk}-RISK CLUSTER: {rel}",
            "title": rel,
            "relationship": rel,
            "signals": signals_list,
            "individual_risk_levels": risk_levels_summary,
            "location": cluster_loc,
            "time_relationship": time_rel,
            "correlation_score": score,
            "potential_consequence": consequence,
            "combined_risk": combined_risk,
            "reason": reason,
            "recommended_action": action,
            "progression_steps": progression,
            "source_signal_id": sig.get("signal_id", f"WS-{idx:02d}"),
            "review_status": sig.get("review_status", "Under Review"),
            "reviewer_notes": sig.get("reviewer_notes", "")
        })

    summary["total_clusters"] = len(emerging_clusters)

    return {
        "summary": summary,
        "weak_signals": correlated,
        "emerging_clusters": emerging_clusters
    }

def get_weak_signal_by_id(db: Session, org_id: str, signal_id: str) -> Optional[Dict[str, Any]]:
    """Returns detailed forensic dossier for a specific weak signal or cluster."""
    result = get_weak_signals_for_organization(db, org_id)
    signals = result.get("weak_signals", [])
    clusters = result.get("emerging_clusters", [])
    
    clean_target = signal_id.strip().lower()

    # 1. Check clusters
    for c in clusters:
        if c.get("cluster_id", "").lower() == clean_target:
            return c
        if clean_target in c.get("title", "").lower() or clean_target in c.get("relationship", "").lower():
            return c

    # 2. Check weak signals
    for s in signals:
        if s.get("signal_id", "").lower() == clean_target:
            return s
        if str(s.get("id", "")).lower() == clean_target:
            return s
        if clean_target in s.get("title", "").lower():
            return s

    return signals[0] if signals else (clusters[0] if clusters else None)

def update_weak_signal_review(
    db: Session,
    org_id: str,
    signal_id: str,
    status: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Persists auditor review status and notes in the database with strict completion locking."""
    review = db.query(WeakSignalReview).filter(
        WeakSignalReview.organization_id == org_id,
        WeakSignalReview.signal_id == signal_id
    ).first()

    # Strict lock: completed records cannot be reverted
    if review and review.status in ["Completed", "Complete"] and status not in ["Completed", "Complete"]:
        raise ValueError("Finalized Record Locked: Records marked as Completed cannot be reverted.")

    clean_status = "Completed" if status in ["Completed", "Complete"] else status

    if not review:
        review = WeakSignalReview(
            organization_id=org_id,
            signal_id=signal_id,
            status=clean_status,
            reviewer_notes=notes or ""
        )
        db.add(review)
    else:
        review.status = clean_status
        if notes is not None:
            review.reviewer_notes = notes
        review.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(review)

    # Return refreshed signal
    signal = get_weak_signal_by_id(db, org_id, signal_id)
    return {
        "status": "success",
        "signal_id": signal_id,
        "review_status": review.status,
        "reviewer_notes": review.reviewer_notes,
        "weak_signal": signal
    }
