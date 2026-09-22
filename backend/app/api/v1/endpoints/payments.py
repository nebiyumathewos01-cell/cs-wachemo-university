from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_student, get_current_admin
from app.models.user import User, UserRole
from app.models.payment import Payment
from app.schemas.payment import (
    PaymentSubmitRequest,
    PaymentReviewRequest,
    PaymentOut,
    PaginatedPayments,
    PaymentStatusResponse,
    DemoQuestion,
    DemoQuestionOption,
    DemoAIAnswer,
)

router = APIRouter(prefix="/payments", tags=["Payments & Access"])


PROMO_DEADLINE_UTC = datetime(2026, 9, 30, 23, 59, 59, tzinfo=timezone.utc)


def get_current_fee_info():
    now = datetime.now(timezone.utc)
    is_promo = now <= PROMO_DEADLINE_UTC
    current_price = 50 if is_promo else 100
    return {
        "price_etb": current_price,
        "regular_price_etb": 100,
        "is_promo": is_promo,
        "promo_deadline": "September 30, 2026",
    }


def _payment_to_out(p: Payment) -> PaymentOut:
    user = p.user
    return PaymentOut(
        id=p.id,
        user_id=p.user_id,
        amount=p.amount,
        currency=p.currency,
        bank_name=p.bank_name,
        account_number=p.account_number,
        account_name=p.account_name,
        transaction_reference=p.transaction_reference,
        sender_name=p.sender_name,
        phone_number=p.phone_number,
        status=p.status,
        admin_notes=p.admin_notes,
        reviewed_at=p.reviewed_at.isoformat() if p.reviewed_at else None,
        created_at=p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat(),
        user_full_name=user.full_name if user else None,
        user_email=user.email if user else None,
        user_username=user.username if user else None,
    )


# ─── Student Endpoints ────────────────────────────────────────

@router.get("/status", response_model=PaymentStatusResponse)
def get_payment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current student's payment/subscription status and bank account information."""
    is_admin = current_user.role == UserRole.admin
    is_paid = True if is_admin else getattr(current_user, "is_paid", False)
    status_val = "approved" if is_admin else getattr(current_user, "payment_status", "unpaid")

    last_payment = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .first()
    )

    fee_info = get_current_fee_info()

    return PaymentStatusResponse(
        is_paid=is_paid,
        payment_status=status_val,
        price_etb=fee_info["price_etb"],
        regular_price_etb=fee_info["regular_price_etb"],
        is_promo=fee_info["is_promo"],
        promo_deadline=fee_info["promo_deadline"],
        bank_name="Commercial Bank of Ethiopia (CBE)",
        account_number="1000503206505",
        account_name="Nebiyu Mathewos",
        last_payment=_payment_to_out(last_payment) if last_payment else None,
    )


@router.post("/submit", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def submit_payment(
    data: PaymentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Submit CBE transaction reference for verification."""
    clean_ref = data.transaction_reference.strip().upper()
    
    # Check if transaction reference is already used
    existing = db.query(Payment).filter(Payment.transaction_reference == clean_ref).first()
    if existing:
        if existing.user_id == current_user.id and existing.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted this transaction reference. It is currently pending verification.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This transaction reference has already been submitted in the system.",
        )

    fee_info = get_current_fee_info()

    # Create new payment record
    payment = Payment(
        user_id=current_user.id,
        amount=fee_info["price_etb"],
        currency="ETB",
        bank_name="Commercial Bank of Ethiopia (CBE)",
        account_number="1000503206505",
        account_name="Nebiyu Mathewos",
        transaction_reference=clean_ref,
        sender_name=data.sender_name.strip(),
        phone_number=data.phone_number.strip() if data.phone_number else None,
        status="pending",
    )
    db.add(payment)

    # Update student payment status
    current_user.payment_status = "pending"
    db.commit()
    db.refresh(payment)

    return _payment_to_out(payment)


@router.get("/history", response_model=list[PaymentOut])
def get_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Get history of payments submitted by the current student."""
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [_payment_to_out(p) for p in payments]


# ─── Public / Free Interactive Demo Content ───────────────────

@router.get("/demo-content")
def get_demo_content():
    """Public endpoint returning interactive demo questions, AI study tutor sample, and platform highlights."""
    questions = [
        DemoQuestion(
            id=1,
            course_name="Data Structures and Algorithms",
            topic="Binary Search Trees & Time Complexity",
            difficulty="medium",
            text="What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) with n nodes?",
            options=[
                DemoQuestionOption(id=1, label="A", text="O(1)", is_correct=False),
                DemoQuestionOption(id=2, label="B", text="O(log n)", is_correct=False),
                DemoQuestionOption(id=3, label="C", text="O(n)", is_correct=True),
                DemoQuestionOption(id=4, label="D", text="O(n log n)", is_correct=False),
            ],
            explanation="In the worst case (e.g., when elements are inserted in sorted order), an unbalanced BST degrades into a linear chain (like a linked list) of height n, making the search time complexity O(n). To guarantee O(log n), self-balancing trees like AVL or Red-Black trees are used.",
        ),
        DemoQuestion(
            id=2,
            course_name="Object Oriented Programming",
            topic="Polymorphism & Dynamic Dispatch",
            difficulty="medium",
            text="In Java/C++, which mechanism enables runtime (dynamic) polymorphism where a subclass overrides a superclass method?",
            options=[
                DemoQuestionOption(id=1, label="A", text="Method Overloading", is_correct=False),
                DemoQuestionOption(id=2, label="B", text="Method Overriding with Virtual Functions / Dynamic Dispatch", is_correct=True),
                DemoQuestionOption(id=3, label="C", text="Encapsulation using Private Variables", is_correct=False),
                DemoQuestionOption(id=4, label="D", text="Static Binding at Compile Time", is_correct=False),
            ],
            explanation="Dynamic polymorphism is achieved through Method Overriding. At runtime, the Java Virtual Machine (or C++ vtable mechanism) examines the actual instantiated object type rather than the reference type, invoking the overridden implementation dynamically.",
        ),
        DemoQuestion(
            id=3,
            course_name="Advanced Database Systems",
            topic="ACID Properties & Transaction Isolation",
            difficulty="hard",
            text="Which ACID property guarantees that intermediate state changes of a transaction are invisible to concurrently executing transactions?",
            options=[
                DemoQuestionOption(id=1, label="A", text="Atomicity", is_correct=False),
                DemoQuestionOption(id=2, label="B", text="Consistency", is_correct=False),
                DemoQuestionOption(id=3, label="C", text="Isolation", is_correct=True),
                DemoQuestionOption(id=4, label="D", text="Durability", is_correct=False),
            ],
            explanation="Isolation ensures that concurrent execution of transactions leaves the database in the same state as if transactions were executed sequentially. It prevents concurrency anomalies like dirty reads, non-repeatable reads, and phantom reads.",
        ),
    ]

    ai_samples = [
        DemoAIAnswer(
            topic="Dijkstra's Algorithm in C++",
            prompt="Explain Dijkstra's shortest path algorithm with C++ syntax",
            response_markdown="""### Dijkstra's Shortest Path Algorithm
**Core Principle**: Finds the shortest path from a single source node to all other vertices in a weighted graph with non-negative weights using a **Min-Priority Queue (Greedy approach)**.

```cpp
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

typedef pair<int, int> pii; // {weight, destination}

void dijkstra(int src, int V, const vector<vector<pii>>& adj) {
    vector<int> dist(V, 1e9);
    priority_queue<pii, vector<pii>, greater<pii>> pq;

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto [w, v] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
}
```
**Time Complexity**: `O((V + E) log V)` using a Binary Heap.
""",
        ),
        DemoAIAnswer(
            topic="Relational Normalization (1NF to 3NF)",
            prompt="How do I normalize a database table to 3rd Normal Form?",
            response_markdown="""### 3-Step Normalization Rulebook
1. **1st Normal Form (1NF)**: Eliminate repeating groups. Every column attribute must be **atomic** (single-valued), and a primary key must exist.
2. **2nd Normal Form (2NF)**: Must be in 1NF and have **no partial dependencies** (every non-key attribute must depend fully on the whole composite primary key).
3. **3rd Normal Form (3NF)**: Must be in 2NF and have **no transitive dependencies** ($A \\rightarrow B$ and $B \\rightarrow C$ where $C$ is a non-key attribute).

> **Rule of Thumb for 3NF**: Every non-key column must depend on **the key, the whole key, and nothing but the key**!
""",
        ),
    ]

    features_unlocked = [
        "Full access to 2nd, 3rd, and 4th Year Wachemo CS courses & lecture slides",
        "Comprehensive National Exit Exam Preparation & Topic-by-Topic Mock Exams",
        "Graduate Profile Exam (GPE) Mastery & CS Competency Drills",
        "Unlimited AI Quiz generation with step-by-step reasoning & weakness analytics",
        "Official Midterm & Final Past Exam papers with solutions",
        "Interactive AI CS Study Assistant for 24/7 concept coaching",
        "Chapter bookmarks, lecture PDF downloads, and student discussion forum",
    ]

    fee_info = get_current_fee_info()

    return {
        "questions": questions,
        "ai_samples": ai_samples,
        "features_unlocked": features_unlocked,
        "price_etb": fee_info["price_etb"],
        "regular_price_etb": fee_info["regular_price_etb"],
        "is_promo": fee_info["is_promo"],
        "promo_deadline": fee_info["promo_deadline"],
        "cbe_account": {
            "bank_name": "Commercial Bank of Ethiopia (CBE)",
            "account_number": "1000503206505",
            "account_name": "Nebiyu Mathewos",
            "fee_etb": fee_info["price_etb"],
        }
    }


# ─── Admin Endpoints ──────────────────────────────────────────

@router.get("/admin/list", response_model=PaginatedPayments)
def admin_list_payments(
    page: int = 1,
    per_page: int = 20,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Admin: view all payment submissions with filtering and search."""
    query = db.query(Payment)

    if status_filter and status_filter != "all":
        query = query.filter(Payment.status == status_filter)

    if search:
        s = f"%{search.strip()}%"
        query = query.join(User, Payment.user_id == User.id).filter(
            (Payment.transaction_reference.ilike(s))
            | (Payment.sender_name.ilike(s))
            | (Payment.phone_number.ilike(s))
            | (User.full_name.ilike(s))
            | (User.email.ilike(s))
        )

    total = query.count()
    payments = (
        query.order_by(Payment.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    pending_count = db.query(func.count(Payment.id)).filter(Payment.status == "pending").scalar() or 0
    approved_count = db.query(func.count(Payment.id)).filter(Payment.status == "approved").scalar() or 0
    rejected_count = db.query(func.count(Payment.id)).filter(Payment.status == "rejected").scalar() or 0

    return PaginatedPayments(
        items=[_payment_to_out(p) for p in payments],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, -(-total // per_page)),
        pending_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
    )


@router.post("/admin/{payment_id}/approve", response_model=PaymentOut)
def admin_approve_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Admin approves payment, unlocks student access immediately."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    payment.status = "approved"
    payment.reviewed_by_id = current_admin.id
    payment.reviewed_at = datetime.now(timezone.utc)

    # Unlock user
    user = db.query(User).filter(User.id == payment.user_id).first()
    if user:
        user.is_paid = True
        user.payment_status = "approved"

    db.commit()
    db.refresh(payment)
    return _payment_to_out(payment)


@router.post("/admin/{payment_id}/reject", response_model=PaymentOut)
def admin_reject_payment(
    payment_id: int,
    payload: PaymentReviewRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Admin rejects payment with an optional reason note."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    payment.status = "rejected"
    payment.admin_notes = payload.admin_notes
    payment.reviewed_by_id = current_admin.id
    payment.reviewed_at = datetime.now(timezone.utc)

    # Update user payment status if no other approved payment exists
    user = db.query(User).filter(User.id == payment.user_id).first()
    if user:
        has_approved = db.query(Payment).filter(
            Payment.user_id == user.id,
            Payment.status == "approved",
            Payment.id != payment_id
        ).first()
        if not has_approved:
            user.is_paid = False
            user.payment_status = "rejected"

    db.commit()
    db.refresh(payment)
    return _payment_to_out(payment)


@router.patch("/admin/student/{user_id}/toggle", response_model=dict)
def admin_toggle_student_payment_access(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Admin manually toggles full paid access on/off for any student."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    user.is_paid = not getattr(user, "is_paid", False)
    user.payment_status = "approved" if user.is_paid else "unpaid"
    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "is_paid": user.is_paid,
        "payment_status": user.payment_status,
        "message": f"Student access {'granted (PAID)' if user.is_paid else 'revoked (UNPAID)'}",
    }
