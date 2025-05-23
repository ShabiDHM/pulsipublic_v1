# pulsi_politik_backend/services/ministry_service.py

from typing import Optional, Dict, List, Any
from ..database.repositories import MinistryRepository, get_previous_period_code # Make sure get_previous_period_code is importable

class MinistryService:
    def __init__(self, ministry_repo: MinistryRepository):
        self.ministry_repo = ministry_repo

    def _select_language_fields(self, data_dict: Optional[Dict[str, Any]], lang: str, text_fields: List[str]) -> Optional[Dict[str, Any]]:
        if not data_dict:
            return None
        
        result = data_dict.copy()
        for base_field_name in text_fields:
            chosen_value = None
            original_value_exists = base_field_name in result
            
            lang_specific_key = f"{base_field_name}_{lang}"
            fallback_en_key = f"{base_field_name}_en"
            
            if lang_specific_key in result and result[lang_specific_key] is not None:
                chosen_value = result[lang_specific_key]
            elif fallback_en_key in result and result[fallback_en_key] is not None:
                chosen_value = result[fallback_en_key]
            elif original_value_exists and result[base_field_name] is not None and \
                 not any(f"{base_field_name}_{s}" in result for s in ['en', 'sq', 'sr']):
                chosen_value = result[base_field_name]

            if chosen_value is not None:
                result[base_field_name] = chosen_value
            elif base_field_name in result and chosen_value is None: # If no value found, but key exists, ensure it's None
                result[base_field_name] = None


            # Clean up suffixed keys after processing
            for suffix in ['en', 'sq', 'sr']:
                suffixed_key = f"{base_field_name}_{suffix}"
                if suffixed_key in result and suffixed_key != base_field_name: # Don't delete if base_field_name itself was a suffixed key (e.g. name_en)
                    del result[suffixed_key]
        return result

    def get_formatted_dashboard_data(self, pillar: str, lang: str, period_code: Optional[str]) -> Dict[str, Any]:
        print(f"MinistryService: get_formatted_dashboard_data called with pillar='{pillar}', lang='{lang}', period_code='{period_code}'")

        # Capitalize pillar to match DB keys if needed, assuming pillar from frontend might be lowercase
        db_pillar_key = pillar.capitalize() 

        raw_ministries_data = self.ministry_repo.get_dashboard_indicators_by_pillar(
            pillar_key_filter=db_pillar_key, # Use capitalized pillar
            period_code=period_code
        )
        
        if raw_ministries_data:
            print(f"MinistryService DEBUG: raw_ministries_data for dashboard (count: {len(raw_ministries_data)}). First item: {dict(raw_ministries_data[0]) if raw_ministries_data else 'N/A'}")
        else:
            print(f"MinistryService DEBUG: raw_ministries_data for dashboard is EMPTY or None for pillar '{db_pillar_key}', period '{period_code}'.")
        
        processed_ministry_items_for_chart = []
        if raw_ministries_data:
            dashboard_item_text_fields = [
                "name", "minister_name",
                "cabinet_member_1_name", "cabinet_member_2_name",
                "cabinet_member_3_name", "cabinet_member_4_name",
                "cabinet_member_5_name"
            ]
            item_count = 0
            for raw_item_row in raw_ministries_data:
                item_count += 1
                raw_item_dict = dict(raw_item_row)
                lang_processed_item = self._select_language_fields(raw_item_dict, lang, dashboard_item_text_fields)

                if lang_processed_item and \
                   lang_processed_item.get('name') is not None and \
                   lang_processed_item.get('score') is not None and \
                   lang_processed_item.get('ministry_id') is not None:

                    cabinet_members_localized = []
                    for i in range(1, 6):
                        member_key = f"cabinet_member_{i}_name"
                        if lang_processed_item.get(member_key) and lang_processed_item[member_key].strip():
                            cabinet_members_localized.append(lang_processed_item[member_key])

                    chart_item = {
                        'id': lang_processed_item.get('ministry_id'),
                        'name': lang_processed_item.get('name'),
                        'score': lang_processed_item.get('score'),
                        'category_key': lang_processed_item.get('category_key'),
                        'minister_name': lang_processed_item.get('minister_name'), 
                        'cabinet_members': cabinet_members_localized 
                    }
                    processed_ministry_items_for_chart.append(chart_item)
                else:
                    print(f"MinistryService WARNING: Item #{item_count} (Original name_en: '{dict(raw_item_row).get('name_en')}') skipped for chart for lang '{lang}'.")

        kpi_summary = self.ministry_repo.get_kpi_summary_for_dashboard(current_period_code=period_code)
        print(f"MinistryService DEBUG: KPI Summary for dashboard: {kpi_summary}")

        print(f"MinistryService DEBUG: Returning {len(processed_ministry_items_for_chart)} items in 'ministries' list for lang '{lang}'.")
        return {
            "ministries": processed_ministry_items_for_chart,
            "kpi_summary": kpi_summary
        }

    def get_formatted_ministry_details(self, ministry_id: int, lang: str, current_period_code: Optional[str] = None) -> Optional[Dict[str, Any]]:
        print(f"MinistryService: get_formatted_ministry_details called for ID {ministry_id}, Lang {lang}, Period {current_period_code}")
        
        raw_profile_row = self.ministry_repo.get_ministry_by_id(ministry_id)
        if not raw_profile_row:
            print(f"MinistryService: No profile found for ministry ID {ministry_id}")
            return None

        raw_profile_dict = dict(raw_profile_row)
        profile_text_fields = ["name", "abbreviation", "minister_name", "website_url", "contact_email", "contact_phone",
                               "cabinet_member_1_name", "cabinet_member_2_name",
                               "cabinet_member_3_name", "cabinet_member_4_name", "cabinet_member_5_name"]
        processed_profile = self._select_language_fields(raw_profile_dict, lang, profile_text_fields)
        
        if processed_profile: 
            processed_profile['ministry_id'] = raw_profile_dict.get('ministry_id') 
            processed_profile['established_date'] = raw_profile_dict.get('established_date')
            processed_profile['last_profile_update'] = raw_profile_dict.get('last_profile_update')
            # Preserve other non-text fields that might be base keys without lang suffixes
            for key, value in raw_profile_dict.items():
                if key not in processed_profile and not any(key.startswith(tf + "_") for tf in profile_text_fields):
                    if key not in ["name_en", "name_sq", "name_sr", # Avoid re-adding already processed suffixed keys
                                   "abbreviation_en", "abbreviation_sq", "abbreviation_sr",
                                   "minister_name_en", "minister_name_sq", "minister_name_sr",
                                   # ... add other suffixed versions of profile_text_fields if necessary
                                   "cabinet_member_1_name_en", "cabinet_member_1_name_sq", "cabinet_member_1_name_sr",
                                   "cabinet_member_2_name_en", "cabinet_member_2_name_sq", "cabinet_member_2_name_sr",
                                   "cabinet_member_3_name_en", "cabinet_member_3_name_sq", "cabinet_member_3_name_sr",
                                   "cabinet_member_4_name_en", "cabinet_member_4_name_sq", "cabinet_member_4_name_sr",
                                   "cabinet_member_5_name_en", "cabinet_member_5_name_sq", "cabinet_member_5_name_sr"]:
                        processed_profile[key] = value


        kpi_keys_for_details = {
            "transparencyScoreDbKey": "website_transparency_score", 
            "infoRequestsReceivedDbKey": "info_requests_received_count",
            "infoRequestsProcessedDbKey": "info_requests_processed_count",
            "avgResponseTimeDbKey": "avg_response_time_days",
            "docAccessibilityDbKey": "document_accessibility_score",
            "reqResponsivenessDbKey": "request_responsiveness_score",
            "infoCompletenessDbKey": "information_completeness_score",
            "publicEngagementDbKey": "public_engagement_score"
        }
        
        performance_breakdown_mapping = [
            {"labelKey": "perfBreakdownWebsiteTransparency", "dbKey": kpi_keys_for_details["transparencyScoreDbKey"]},
            {"labelKey": "perfBreakdownDocAccessibility",    "dbKey": kpi_keys_for_details["docAccessibilityDbKey"]},
            {"labelKey": "perfBreakdownReqResponsiveness",   "dbKey": kpi_keys_for_details["reqResponsivenessDbKey"]},
            {"labelKey": "perfBreakdownInfoCompleteness",  "dbKey": kpi_keys_for_details["infoCompletenessDbKey"]},
            {"labelKey": "perfBreakdownPublicEngagement",  "dbKey": kpi_keys_for_details["publicEngagementDbKey"]},
        ]

        kpis_current_period_raw = []
        kpis_previous_period_raw = []
        previous_period_code = None

        db_kpi_keys_to_fetch = list(kpi_keys_for_details.values())

        if current_period_code:
            print(f"MinistryService: Fetching KPIs for current period {current_period_code}, keys: {db_kpi_keys_to_fetch}")
            # *** THIS IS THE CORRECTED CALL ***
            kpis_current_period_raw = self.ministry_repo.get_kpis_for_ministry(
                ministry_id,
                kpi_name_keys_list=db_kpi_keys_to_fetch,
                period_code_filter=current_period_code # Changed from period_end_date
            )
            # **********************************
            print(f"MinistryService: Raw KPIs for current period {current_period_code}: {kpis_current_period_raw}")
            
            previous_period_code = get_previous_period_code(current_period_code)
            if previous_period_code:
                print(f"MinistryService: Fetching KPIs for previous period {previous_period_code}, keys: {db_kpi_keys_to_fetch}")
                # *** THIS IS THE CORRECTED CALL ***
                kpis_previous_period_raw = self.ministry_repo.get_kpis_for_ministry(
                    ministry_id,
                    kpi_name_keys_list=db_kpi_keys_to_fetch,
                    period_code_filter=previous_period_code # Changed from period_end_date
                )
                # **********************************
                print(f"MinistryService: Raw KPIs for previous period {previous_period_code}: {kpis_previous_period_raw}")
        else:
            print("MinistryService WARN: No current_period_code provided for ministry details KPI fetching. KPIs might be incomplete.")

        def get_kpi_value(kpi_list, target_kpi_name_key):
            for kpi_item in kpi_list:
                if kpi_item['kpi_name_key'] == target_kpi_name_key:
                    return kpi_item.get('kpi_value_numeric')
            return None

        frontend_kpis_structure = {
            "transparencyScore": {"value": None, "change": None, "unit": "%"}, 
            "infoRequests": {"received": None, "processed": None, "unit": "count"}, 
            "responseTime": {"value": None, "change": None, "unit": "days"} 
        }

        current_ts_val = get_kpi_value(kpis_current_period_raw, kpi_keys_for_details["transparencyScoreDbKey"])
        prev_ts_val = get_kpi_value(kpis_previous_period_raw, kpi_keys_for_details["transparencyScoreDbKey"])
        frontend_kpis_structure["transparencyScore"]["value"] = current_ts_val
        if current_ts_val is not None and prev_ts_val is not None:
            frontend_kpis_structure["transparencyScore"]["change"] = round(current_ts_val - prev_ts_val, 1)

        frontend_kpis_structure["infoRequests"]["received"] = get_kpi_value(kpis_current_period_raw, kpi_keys_for_details["infoRequestsReceivedDbKey"])
        frontend_kpis_structure["infoRequests"]["processed"] = get_kpi_value(kpis_current_period_raw, kpi_keys_for_details["infoRequestsProcessedDbKey"])

        current_rt_val = get_kpi_value(kpis_current_period_raw, kpi_keys_for_details["avgResponseTimeDbKey"])
        prev_rt_val = get_kpi_value(kpis_previous_period_raw, kpi_keys_for_details["avgResponseTimeDbKey"])
        frontend_kpis_structure["responseTime"]["value"] = current_rt_val
        if current_rt_val is not None and prev_rt_val is not None:
            frontend_kpis_structure["responseTime"]["change"] = round(current_rt_val - prev_rt_val, 1)
        
        print(f"MinistryService DEBUG: Structured frontend KPIs for details: {frontend_kpis_structure}")

        performance_breakdown_data = []
        for item_map in performance_breakdown_mapping:
            value = get_kpi_value(kpis_current_period_raw, item_map["dbKey"])
            performance_breakdown_data.append({
                "labelKey": item_map["labelKey"], # This will be used by frontend i18n
                "value": value if value is not None else 0 # Default to 0 if None, for progress bars
            })
        print(f"MinistryService DEBUG: Structured performance breakdown: {performance_breakdown_data}")

        raw_activities = self.ministry_repo.get_recent_activities_for_ministry(ministry_id)
        activity_text_fields = ["title", "description", "category"]
        processed_activities = []
        if raw_activities:
            for act_row in raw_activities:
                act_dict = dict(act_row)
                lang_processed_act = self._select_language_fields(act_dict, lang, activity_text_fields)
                if lang_processed_act:
                    # Re-add non-text fields that _select_language_fields might have removed if their base key was same
                    lang_processed_act['activity_id'] = act_dict.get('activity_id')
                    lang_processed_act['activity_date'] = act_dict.get('activity_date')
                    lang_processed_act['source_url'] = act_dict.get('source_url')
                    lang_processed_act['is_highlight'] = act_dict.get('is_highlight')
                    lang_processed_act['created_at'] = act_dict.get('created_at')
                    # Ensure all base keys are present even if None after lang processing
                    for tf in activity_text_fields:
                        if tf not in lang_processed_act:
                            lang_processed_act[tf] = None
                    processed_activities.append(lang_processed_act)
        print(f"MinistryService DEBUG: Processed activities count: {len(processed_activities)}")

        final_details = {
            "profile": processed_profile if processed_profile else {},
            "kpis": frontend_kpis_structure,
            "performanceBreakdown": performance_breakdown_data,
            "activities": processed_activities
        }
        print(f"MinistryService DEBUG: Final formatted ministry details: {final_details}") # Be careful logging this if it's huge
        return final_details