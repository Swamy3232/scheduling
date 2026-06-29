from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Booking, Service, Manpower, ServicePrice
from schemas import BookingCreate
from send_whatsapp import send_whatsapp

router = APIRouter(prefix="/bookings", tags=["Bookings"])


# =====================================================
#                CREATE BOOKING (POST)
# =====================================================
@router.post("/")
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    assigned_by: str = Query("system"),
):
    # Validate dates
    if booking.end_date <= booking.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    # Check service exists
    service = db.query(Service).filter(Service.service_id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Check service overlap
    overlap = db.query(Booking).filter(
        Booking.service_id == booking.service_id,
        Booking.start_date < booking.end_date,
        Booking.end_date > booking.start_date,
    ).first()

    if overlap:
        raise HTTPException(status_code=400, detail="Service is already booked")

    # If manpower selected manually
    if booking.manpower_name:
        manpower = db.query(Manpower).filter(Manpower.name == booking.manpower_name).first()
        if not manpower:
            raise HTTPException(status_code=404, detail="Manpower not found")

        # Leave-date check
        if manpower.leave_date:
            if booking.start_date.date() <= manpower.leave_date <= booking.end_date.date():
                raise HTTPException(
                    status_code=400,
                    detail=f"{manpower.name} is on leave on {manpower.leave_date}"
                )

        manpower_overlap = db.query(Booking).filter(
            Booking.name == booking.manpower_name,
            Booking.start_date < booking.end_date,
            Booking.end_date > booking.start_date,
        ).first()

        if manpower_overlap:
            raise HTTPException(status_code=400, detail="Selected manpower is already booked")

    else:
        # Auto assign manpower
        manpower = None
        for m in db.query(Manpower).all():

            # Leave-date check
            if m.leave_date:
                if booking.start_date.date() <= m.leave_date <= booking.end_date.date():
                    continue  # Skip manpower on leave

            overlap = db.query(Booking).filter(
                Booking.name == m.name,
                Booking.start_date < booking.end_date,
                Booking.end_date > booking.start_date,
            ).first()

            if not overlap:
                manpower = m
                break

        if not manpower:
            raise HTTPException(status_code=400, detail="No free manpower available")

    # Validate price_type
    if booking.price_type:
        price_entry = db.query(ServicePrice).filter(
            ServicePrice.service_id == booking.service_id,
            ServicePrice.price_type == booking.price_type,
        ).first()

        if not price_entry:
            raise HTTPException(status_code=404, detail="Invalid price_type")

    # Create booking
    new_booking = Booking(
        service_id=service.service_id,
        service_name=service.service_name,
        name=manpower.name,
        start_date=booking.start_date,
        end_date=booking.end_date,
        assigned_by=assigned_by,
        category=booking.category,
        department=booking.department,
        price_type=booking.price_type,
        remarks=booking.remarks,
        remarks_update=booking.remarks,
        workstatus='pending',
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return {
        "message": "Booking created successfully",
        "booking_id": new_booking.booking_id,
        "service_name": new_booking.service_name,
        "manpower_name": new_booking.name,
        "remarks": new_booking.remarks,
        "remarks_update": new_booking.remarks_update,
    }



# =====================================================
#                GET ALL BOOKINGS
# =====================================================
@router.get("/")
def get_all_bookings(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()

    return [
        {
            "booking_id": b.booking_id,
            "service_name": b.service_name,
            "manpower_name": b.name,
            "start_date": b.start_date,
            "end_date": b.end_date,
            "assigned_by": b.assigned_by,
            "service_id": b.service_id,
            "category": b.category,
            "department": b.department,
            "price_type": b.price_type,
            "remarks": b.remarks,     # ✅ Included
            "remarks_update": b.remarks_update,   # ✅ Included
            "workstatus": b.workstatus,
        }
        for b in bookings
    ]


# =====================================================
#                GET ONE BOOKING
# =====================================================
@router.get("/{booking_id}")
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "booking_id": booking.booking_id,
        "service_name": booking.service_name,
        "manpower_name": booking.name,
        "start_date": booking.start_date,
        "end_date": booking.end_date,
        "assigned_by": booking.assigned_by,
        "service_id": booking.service_id,
        "category": booking.category,
        "department": booking.department,
        "price_type": booking.price_type,
        "remarks": booking.remarks,      # ✅ Included
        "remarks_update": booking.remarks_update,   # ✅ Included
        "workstatus": booking.workstatus,
    }


# =====================================================
#                UPDATE BOOKING (PUT)
# =====================================================
@router.put("/{booking_id}")
def update_booking(
    booking_id: int,
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    assigned_by: str = Query(None),
    price_type: str = Query(None),
    category: str = Query(None),
    department: str = Query(None),
    remarks: str = Query(None),
    remarks_update: str = Query(None),
    workstatus: str = Query(None),
    manpower_name: str = Query(None),    # ✅ NEW
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # =====================================================
    #                DATE UPDATE + VALIDATION
    # =====================================================
    if start_date and end_date:
        if end_date <= start_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")

        # Check overlap for same service
        overlap = db.query(Booking).filter(
            Booking.service_id == booking.service_id,
            Booking.booking_id != booking_id,
            Booking.start_date < end_date,
            Booking.end_date > start_date,
        ).first()

        if overlap:
            raise HTTPException(status_code=400, detail="Time slot already booked")

        booking.start_date = start_date
        booking.end_date = end_date

    # =====================================================
    #                ASSIGNED BY
    # =====================================================
    if assigned_by:
        booking.assigned_by = assigned_by

    # =====================================================
    #                PRICE TYPE UPDATE
    # =====================================================
    if price_type:
        price_entry = db.query(ServicePrice).filter(
            ServicePrice.service_id == booking.service_id,
            ServicePrice.price_type == price_type,
        ).first()
        if not price_entry:
            raise HTTPException(status_code=404, detail="Invalid price_type")

        booking.price_type = price_type

    # =====================================================
    #                CATEGORY & DEPARTMENT
    # =====================================================
    if category:
        booking.category = category

    if department:
        booking.department = department

    # =====================================================
    #                REMARKS + REMARKS UPDATE
    # =====================================================
    if remarks is not None:
        booking.remarks = remarks

    if remarks_update is not None:
        booking.remarks_update = remarks_update

    # =====================================================
    #                WORK STATUS
    # =====================================================
    if workstatus is not None:
        booking.workstatus = workstatus

    # =====================================================
    #                MANPOWER UPDATE
    # =====================================================
    if manpower_name:

        # 1️⃣ Check manpower exists
        manpower = db.query(Manpower).filter(Manpower.name == manpower_name).first()
        if not manpower:
            raise HTTPException(status_code=404, detail="Manpower not found")

        # 2️⃣ Leave date check
        if manpower.leave_date:
            if booking.start_date.date() <= manpower.leave_date <= booking.end_date.date():
                raise HTTPException(
                    status_code=400,
                    detail=f"{manpower.name} is on leave on {manpower.leave_date}"
                )

        # 3️⃣ Overlap check (same manpower)
        manpower_overlap = db.query(Booking).filter(
            Booking.name == manpower_name,
            Booking.booking_id != booking_id,
            Booking.start_date < booking.end_date,
            Booking.end_date > booking.start_date,
        ).first()

        if manpower_overlap:
            raise HTTPException(
                status_code=400,
                detail=f"{manpower_name} is already booked in this time range"
            )

        # 4️⃣ Update manpower
        booking.name = manpower_name

    # =====================================================
    #                SAVE CHANGES
    # =====================================================
    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking updated successfully",
        "booking_id": booking.booking_id,
        "updated_fields": {
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "assigned_by": booking.assigned_by,
            "price_type": booking.price_type,
            "category": booking.category,
            "department": booking.department,
            "remarks": booking.remarks,
            "remarks_update": booking.remarks_update,
            "manpower_name": booking.name,     # ✅ Included
            "workstatus": booking.workstatus,
        },
    }




# =====================================================
#                DELETE BOOKING
# =====================================================
@router.delete("/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()
    return {"message": "🗑️ Booking deleted successfully"}
@router.get("/api/service_manpower/{service_id}")
def get_manpower_for_service(service_id: int, db: Session = Depends(get_db)):
    manpower = (
        db.query(Manpower)
        .filter(Manpower.service_id == service_id)
        .all()
    )

    if not manpower:
        raise HTTPException(status_code=404, detail="No manpower found for this service")

    return [
        {
            "manpower_id": m.manpower_id,
            "name": m.name,
            "contact": m.contact,
            "service_id": m.service_id,
        }
        for m in manpower
    ]
@router.get("/bookings/free_manpower")
def get_free_manpower(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    service_id: int = Query(None),
    db: Session = Depends(get_db),
):
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    # 1️⃣ Get all manpower
    query = db.query(Manpower)
    if service_id:
        query = query.filter(Manpower.service_id == service_id)

    all_manpower = query.all()

    free_manpower = []

    for m in all_manpower:
        # 2️⃣ Check if this manpower has overlap booking
        overlap = (
            db.query(Booking)
            .filter(
                Booking.service_id == m.service_id,
                Booking.start_date < end_date,
                Booking.end_date > start_date,
            )
            .first()
        )

        if not overlap:
            free_manpower.append(
                {
                    "manpower_id": m.manpower_id,
                    "name": m.name,
                    "contact": m.contact,
                    "service_id": m.service_id,
                }
            )

    return {
        "count": len(free_manpower),
        "free_manpower": free_manpower,
    }
