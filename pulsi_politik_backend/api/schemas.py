# pulsi_politik_backend/api/schemas.py

from pydantic import BaseModel, Field, HttpUrl, ConfigDict # Import ConfigDict for Pydantic V2
from typing import List, Optional, Any 
from datetime import date, datetime 

# --- Schemas for Ministry Details Endpoint ---

class MinistryProfileSchema(BaseModel):
    # [AI PROMPT]: Explain the Pydantic model `MinistryProfileSchema`. What does `BaseModel` mean? How are fields like `ministry_id: int` and `name: Optional[str]` defined and validated by Pydantic?
    ministry_id: int
    name: Optional[str] = None 
    abbreviation: Optional[str] = None
    minister_name: Optional[str] = None
    category_key: Optional[str] = None
    cabinet_member_1_name: Optional[str] = None
    cabinet_member_2_name: Optional[str] = None
    cabinet_member_3_name: Optional[str] = None
    cabinet_member_4_name: Optional[str] = None
    cabinet_member_5_name: Optional[str] = None
    established_date: Optional[str] = None 
    website_url: Optional[HttpUrl] = None 
    contact_email: Optional[str] = None 
    contact_phone: Optional[str] = None
    last_profile_update: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True) # Pydantic V2 style

class MinistryIndicatorSchema(BaseModel):
    # [AI PROMPT]: Explain the `MinistryIndicatorSchema`. How does it handle potentially missing fields using `Optional`? What would be the benefit of changing `assessment_date: Optional[str]` to `assessment_date: Optional[date]`?
    indicator_log_id: int
    ministry_id: int
    pillar_key: str
    indicator_name: Optional[str] = None 
    value: float
    unit: Optional[str] = None
    assessment_date: Optional[str] = None 
    period_code: Optional[str] = None
    description: Optional[str] = None 
    data_source: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)

class MinistryKpiSchema(BaseModel):
    # [AI PROMPT]: Explain the `MinistryKpiSchema`. How would you define a field that could be either a number or text, like `kpi_value_numeric` and `kpi_value_text`?
    kpi_id: int
    ministry_id: int
    kpi_name_key: str
    kpi_value_numeric: Optional[float] = None
    kpi_value_text: Optional[str] = None
    unit: Optional[str] = None
    period_start_date: str 
    period_end_date: str   
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MinistryActivitySchema(BaseModel):
    # [AI PROMPT]: Explain the `MinistryActivitySchema`. How does Pydantic handle the `is_highlight` field, which is likely an integer (0 or 1) but could be interpreted as a boolean?
    activity_id: int
    ministry_id: int
    activity_date: str 
    title: Optional[str] = None 
    description: Optional[str] = None 
    category: Optional[str] = None 
    source_url: Optional[HttpUrl] = None
    is_highlight: Optional[int] = 0 
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MinistryDetailsResponse(BaseModel):
    # [AI PROMPT]: Explain the `MinistryDetailsResponse` schema. How does it use other Pydantic models (`MinistryProfileSchema`, `MinistryIndicatorSchema`, etc.) to define a nested JSON structure for an API response?
    profile: MinistryProfileSchema
    indicators: List[MinistryIndicatorSchema] 
    kpis: List[MinistryKpiSchema]
    activities: List[MinistryActivitySchema]

# --- Schemas for Dashboard Data Endpoint ---

class DashboardMinistrySchema(BaseModel):
    # [AI PROMPT]: Explain the `DashboardMinistrySchema`. This is for the items in the 'ministries' list of the dashboard response.
    id: int
    name: Optional[str] = None 
    score: float
    category_key: Optional[str] = None # ADDED category_key

    model_config = ConfigDict(from_attributes=True)

class DashboardDataResponse(BaseModel):
    # [AI PROMPT]: Explain the `DashboardDataResponse` schema. How does it define the structure for the `/api/dashboard_data` endpoint's response?
    ministries: List[DashboardMinistrySchema]
    # kpi_summary: Optional[Dict[str, Any]] = None # If you re-add kpi_summary