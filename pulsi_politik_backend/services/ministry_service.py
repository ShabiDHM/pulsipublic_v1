# pulsi_politik_backend/services/ministry_service.py
import datetime 
from typing import Dict, List, Optional, Any
from ..database.repositories import MinistryRepository, get_previous_period_code, get_end_date_from_period_code 

class MinistryService:
    def __init__(self, ministry_repo: MinistryRepository):
        self.ministry_repo = ministry_repo
        self.details_page_kpi_keys = [ 
            'website_transparency_score', 
            'document_accessibility_score',
            'request_responsiveness_score',
            'information_completeness_score',
            'public_engagement_score',
        ]
        self.details_page_card_kpi_keys = [
            'info_requests_received_count',
            'info_requests_processed_count',
            'avg_response_time_days'
        ]

    def _select_language_fields(self, data_dict: Optional[Dict[str, Any]], lang: str, text_fields: List[str]) -> Optional[Dict[str, Any]]:
        if not data_dict: return None
        result = data_dict.copy()
        for base_field_name in text_fields:
            chosen_value = None; original_value_exists = base_field_name in result
            lang_specific_key = f"{base_field_name}_{lang}"; fallback_en_key = f"{base_field_name}_en"
            if lang_specific_key in result and result[lang_specific_key] is not None: chosen_value = result[lang_specific_key]
            elif fallback_en_key in result and result[fallback_en_key] is not None: chosen_value = result[fallback_en_key]
            elif original_value_exists and result[base_field_name] is not None and not any(f"{base_field_name}_{s}" in result for s in ['en', 'sq', 'sr']): chosen_value = result[base_field_name]
            if chosen_value is not None: result[base_field_name] = chosen_value
            elif base_field_name in result and chosen_value is None: result[base_field_name] = None
            for suffix in ['en', 'sq', 'sr']:
                suffixed_key = f"{base_field_name}_{suffix}"
                if suffixed_key in result and suffixed_key != base_field_name: del result[suffixed_key]
        return result

    def get_formatted_dashboard_data(self, pillar: str, lang: str, period_code: Optional[str]) -> Dict[str, Any]:
        db_pillar_key = pillar.capitalize()
        ministries_data_for_chart = []

        if db_pillar_key in ["Transparency", "Participation", "Efficiency"]:
            raw_ministries_data = self.ministry_repo.get_dashboard_indicators_by_pillar(
                pillar_key_filter=db_pillar_key, period_code=period_code
            )
            if raw_ministries_data:
                dashboard_item_text_fields = ["name", "minister_name", "cabinet_member_1_name", "cabinet_member_2_name", "cabinet_member_3_name", "cabinet_member_4_name", "cabinet_member_5_name"]
                for raw_item_row in raw_ministries_data:
                    raw_item_dict = dict(raw_item_row)
                    lang_processed_item = self._select_language_fields(raw_item_dict, lang, dashboard_item_text_fields)
                    if lang_processed_item and lang_processed_item.get('name') is not None and lang_processed_item.get('score') is not None and lang_processed_item.get('ministry_id') is not None:
                        cabinet_members_localized = [lang_processed_item.get(f"cabinet_member_{i}_name") for i in range(1, 6) if lang_processed_item.get(f"cabinet_member_{i}_name","").strip()]
                        chart_item = {
                            'id': lang_processed_item.get('ministry_id'),
                            'name': lang_processed_item.get('name'),
                            'score': lang_processed_item.get('score'),
                            'category_key': lang_processed_item.get('category_key'),
                            'minister_name': lang_processed_item.get('minister_name'),
                            'cabinet_members': cabinet_members_localized
                        }
                        ministries_data_for_chart.append(chart_item)
        
        elif db_pillar_key == "Outcome" and period_code:
            all_pillar_scores_raw = self.ministry_repo.get_all_pillar_scores_for_period(period_code)
            scores_by_ministry: Dict[int, Dict[str, Any]] = {}
            for row_data in all_pillar_scores_raw:
                m_id = row_data['ministry_id']
                if m_id not in scores_by_ministry:
                    scores_by_ministry[m_id] = { 'details_raw': dict(row_data), 'pillar_scores': {} }
                scores_by_ministry[m_id]['pillar_scores'][row_data['pillar_key']] = row_data['score']
            for ministry_id, data in scores_by_ministry.items():
                current_pillar_scores = [data['pillar_scores'].get("Transparency"), data['pillar_scores'].get("Participation"), data['pillar_scores'].get("Efficiency")]
                valid_scores = [s for s in current_pillar_scores if s is not None]
                outcome_score = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else None
                ministry_detail_dict_raw = data['details_raw']
                outcome_item_text_fields = ["name", "minister_name", "cabinet_member_1_name", "cabinet_member_2_name", "cabinet_member_3_name", "cabinet_member_4_name", "cabinet_member_5_name"] 
                lang_processed_details = self._select_language_fields(ministry_detail_dict_raw, lang, outcome_item_text_fields)
                cabinet_members_localized = []
                if lang_processed_details:
                    for i in range(1, 6):
                        member_name = lang_processed_details.get(f"cabinet_member_{i}_name")
                        if member_name and isinstance(member_name, str) and member_name.strip(): cabinet_members_localized.append(member_name)
                ministries_data_for_chart.append({
                    "id": ministry_id,
                    "name": lang_processed_details.get("name", "Unknown Ministry") if lang_processed_details else "Unknown Ministry",
                    "score": outcome_score, 
                    "category_key": ministry_detail_dict_raw.get('category_key', 'unknown'),
                    "minister_name": lang_processed_details.get('minister_name', 'N/A') if lang_processed_details else 'N/A',
                    "cabinet_members": cabinet_members_localized
                })
            ministries_data_for_chart.sort(key=lambda x: x.get('score') if x.get('score') is not None else -1, reverse=True)

        kpi_summary = self.ministry_repo.get_kpi_summary_for_dashboard(current_period_code=period_code)
        return { "ministries": ministries_data_for_chart, "kpi_summary": kpi_summary }

    def get_formatted_ministry_details(self, ministry_id: int, lang: str, current_period_code: Optional[str] = None) -> Optional[Dict[str, Any]]:
        raw_profile_row = self.ministry_repo.get_ministry_by_id(ministry_id)
        if not raw_profile_row: return None
        raw_profile_dict = dict(raw_profile_row)
        profile_text_fields = ["name", "abbreviation", "minister_name", "website_url", "contact_email", "contact_phone", "cabinet_member_1_name", "cabinet_member_2_name", "cabinet_member_3_name", "cabinet_member_4_name", "cabinet_member_5_name"]
        processed_profile = self._select_language_fields(raw_profile_dict, lang, profile_text_fields)
        if processed_profile: 
            processed_profile['ministry_id'] = raw_profile_dict.get('ministry_id'); processed_profile['established_date'] = raw_profile_dict.get('established_date'); processed_profile['last_profile_update'] = raw_profile_dict.get('last_profile_update')
            for key, value in raw_profile_dict.items():
                if key not in processed_profile and not any(key.startswith(tf + "_") for tf in profile_text_fields):
                    if not any(key == f"{tf}_{s}" for tf in profile_text_fields for s in ['en', 'sq', 'sr']): processed_profile[key] = value
        
        all_kpi_keys_to_fetch = list(set(self.details_page_kpi_keys + self.details_page_card_kpi_keys))
        kpis_current_period_raw = []
        kpis_previous_period_raw = []
        previous_period_code = None

        if current_period_code:
            print(f"MinistryService: Fetching KPIs for current period {current_period_code}, keys: {all_kpi_keys_to_fetch}")
            kpis_current_period_raw = self.ministry_repo.get_kpis_for_ministry(ministry_id, kpi_name_keys_list=all_kpi_keys_to_fetch, period_code_filter=current_period_code)
            # *** UNCOMMENTED FOR DEBUGGING PERFORMANCE BREAKDOWN & ACTIVITY DATES ***
            print(f"MinistryService DEBUG: Raw KPIs for current period {current_period_code}: {kpis_current_period_raw}") 
            # *** END UNCOMMENT ***
            previous_period_code = get_previous_period_code(current_period_code)
            if previous_period_code:
                kpis_previous_period_raw = self.ministry_repo.get_kpis_for_ministry(ministry_id, kpi_name_keys_list=all_kpi_keys_to_fetch, period_code_filter=previous_period_code)
        
        def get_kpi_value(kpi_list, target_kpi_name_key):
            for kpi_item in kpi_list:
                if kpi_item['kpi_name_key'] == target_kpi_name_key: return kpi_item.get('kpi_value_numeric')
            return None

        detail_page_top_kpis = {
            "transparencyScore": {"value": None, "change": None, "unit": "%"}, 
            "infoRequests": {"received": None, "processed": None, "percentage_processed": None, "unit": "count"}, 
            "responseTime": {"value": None, "change": None, "unit": "days"} 
        }
        current_ts_val = get_kpi_value(kpis_current_period_raw, 'website_transparency_score')
        prev_ts_val = get_kpi_value(kpis_previous_period_raw, 'website_transparency_score')
        detail_page_top_kpis["transparencyScore"]["value"] = current_ts_val
        if current_ts_val is not None and prev_ts_val is not None: detail_page_top_kpis["transparencyScore"]["change"] = round(current_ts_val - prev_ts_val, 1)
        detail_page_top_kpis["infoRequests"]["received"] = get_kpi_value(kpis_current_period_raw, 'info_requests_received_count')
        detail_page_top_kpis["infoRequests"]["processed"] = get_kpi_value(kpis_current_period_raw, 'info_requests_processed_count')
        if detail_page_top_kpis["infoRequests"]["received"] and detail_page_top_kpis["infoRequests"]["processed"] and detail_page_top_kpis["infoRequests"]["received"] > 0:
            detail_page_top_kpis["infoRequests"]["percentage_processed"] = round((detail_page_top_kpis["infoRequests"]["processed"] / detail_page_top_kpis["infoRequests"]["received"]) * 100, 1)
        current_rt_val = get_kpi_value(kpis_current_period_raw, 'avg_response_time_days')
        prev_rt_val = get_kpi_value(kpis_previous_period_raw, 'avg_response_time_days')
        detail_page_top_kpis["responseTime"]["value"] = current_rt_val
        if current_rt_val is not None and prev_rt_val is not None: detail_page_top_kpis["responseTime"]["change"] = round(current_rt_val - prev_rt_val, 1)
        for kpi_item in kpis_current_period_raw:
            if kpi_item['kpi_name_key'] == 'avg_response_time_days' and kpi_item.get('unit'):
                detail_page_top_kpis["responseTime"]["unit"] = kpi_item.get('unit'); break
        
        performance_breakdown_data = []
        label_key_map = { 'website_transparency_score': 'perfBreakdownWebsiteTransparency', 'document_accessibility_score': 'perfBreakdownDocAccessibility', 'request_responsiveness_score': 'perfBreakdownReqResponsiveness', 'information_completeness_score': 'perfBreakdownInfoCompleteness', 'public_engagement_score': 'perfBreakdownPublicEngagement' }
        for key in self.details_page_kpi_keys:
            value = get_kpi_value(kpis_current_period_raw, key)
            performance_breakdown_data.append({ "labelKey": label_key_map.get(key, key), "value": value if value is not None else 0 })
        
        # *** ADDED DIAGNOSTIC LOG for performance_breakdown_data ***
        print(f"MinistryService DEBUG: Constructed performance_breakdown_data: {performance_breakdown_data}")
        # *** END DIAGNOSTIC LOG ***

        raw_activities = self.ministry_repo.get_recent_activities_for_ministry(ministry_id)
        # *** ADDED DIAGNOSTIC LOG for raw_activities ***
        print(f"MinistryService DEBUG: Raw activities from DB for ministry {ministry_id}: {raw_activities}")
        # *** END DIAGNOSTIC LOG ***

        activity_text_fields = ["title", "description", "category"]
        processed_activities = []
        if raw_activities:
            for act_row in raw_activities:
                act_dict = dict(act_row); lang_processed_act = self._select_language_fields(act_dict, lang, activity_text_fields)
                if lang_processed_act:
                    for k_act in ['activity_id', 'activity_date', 'source_url', 'is_highlight', 'created_at']: lang_processed_act[k_act] = act_dict.get(k_act)
                    for tf_act in activity_text_fields: 
                        if tf_act not in lang_processed_act: lang_processed_act[tf_act] = None
                    processed_activities.append(lang_processed_act)
        return {
            "profile": processed_profile if processed_profile else {},
            "kpis": detail_page_top_kpis, 
            "performanceBreakdown": performance_breakdown_data,
            "activities": processed_activities 
        }