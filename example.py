URL = "https://kinome.app"
#URL = "http://localhost:3000"

prompt = open("modulate-prompt.txt", "r").read()

def check_usage_limits():
    """
    Check if today's token usage exceeds the daily limits.
    Returns True if within limits, False if limits exceeded.
    
    Limits:
    - gpt-5.1-2025-11-13: 240,000 tokens (input + output)
    - gpt-5-mini + gpt-5-nano: 2,500,000 tokens (input + output)
    """
    try:
        # Calculate today's start time (midnight UTC)
        today_start = int(datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        
        headers = {
            "Authorization": f"Bearer {ADMIN_KEY}",
            "Content-Type": "application/json",
        }
        
        params = {
            "start_time": today_start,
            "bucket_width": "1d",
            "group_by": ["model"],
        }
        
        url = "https://api.openai.com/v1/organization/usage/completions"
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Warning: Could not fetch usage data (status {response.status_code})")
            print("Proceeding anyway...")
            return True
        
        data = response.json()
        
        # Track totals
        gpt_5_1_total = 0
        gpt_mini_nano_total = 0
        
        # Parse the response
        for bucket in data.get("data", []):
            for result in bucket.get("results", []):
                model = result.get("model", "")
                input_tokens = result.get("input_tokens", 0)
                output_tokens = result.get("output_tokens", 0)
                total_tokens = input_tokens + output_tokens
                
                if model == "gpt-5.1-2025-11-13":
                    gpt_5_1_total += total_tokens
                elif model in ["gpt-5-mini-2025-08-07", "gpt-5-nano-2025-08-07"]:
                    gpt_mini_nano_total += total_tokens
              
        # Check limits
        if gpt_5_1_total > 240_000:
            print(f"❌ LIMIT EXCEEDED: gpt-5.1 used {gpt_5_1_total:,} tokens today")
            print(f"   Limit: 240,000 tokens")
            return False
        
        if gpt_mini_nano_total > 2_500_000:
            print(f"❌ LIMIT EXCEEDED: mini+nano used {gpt_mini_nano_total:,} tokens today")
            print(f"   Limit: 2,500,000 tokens")
            return False
        
        return True
        
    except Exception as e:
        print(f"Error checking usage limits: {str(e)}")
        print("Proceeding anyway...")
        return True


def extract_json(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*?\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
        return None


def add_swaps(suggested_queries, base_food_id, base_hidx):
    swaps = []
    for suggested_food in suggested_queries:
        try:
            response = requests.post(f"{URL}/api/db/request-food", json={
                "query": suggested_food,
                "from_user": False
            })
            swap_food_id = response.json()["data"]["id"]
            swap_food_result = supabase.table("food_names").select("food_id").eq("id", swap_food_id).execute().data
            if not swap_food_result:
                continue
            swap_food = swap_food_result[0]
            swap_food_hidx_result = supabase.table("foods").select("hidx").eq("id", swap_food["food_id"]).execute().data
            if not swap_food_hidx_result:
                continue
            swap_food_hidx = swap_food_hidx_result[0]["hidx"]
            if(swap_food_hidx > (base_hidx +5)):
                swaps.append({"food_id": base_food_id, "swap_id": swap_food_id})
        except Exception as e:
            continue
            
    if swaps:
        try:
            supabase.table("foods_healthier_swap_suggestions").insert(swaps).execute()
        except Exception as e:
            raise e

def getTopThreeMicros(food):
    # Reference values (daily recommendations in same units as food data)
    reference_values = {
        "calcium_mg": 1000,
        "choline_mg": 550,
        "copper_mg": 0.9,
        "folate_ug_dfe": 400,
        "iodine_ug": 150,
        "iron_mg": 18,
        "magnesium_mg": 400,
        "manganese_mg": 2.3,
        "mufas_total_mg": 25000,  # ~25g as reasonable target
        "niacin_b3_mg": 16,
        "omega3_total_mg": 800,  # Lowered to highlight omega-3 rich foods
        "potassium_mg": 4700,
        "riboflavin_b2_mg": 1.3,
        "selenium_ug": 55,
        "thiamine_b1_mg": 1.2,
        "vitamin_a_ug_rae": 900,
        "vitamin_b12_ug": 2.4,
        "vitamin_b6_mg": 1.7,
        "vitamin_c_mg": 90,
        "vitamin_d_ug": 20,
        "vitamin_e_mg_alpha_te": 15,
        "vitamin_k_ug": 120,
        "zinc_mg": 11
    }
    
    relevances = []
    for nutrient, ref_value in reference_values.items():
        if nutrient in food and food[nutrient] is not None and food[nutrient] > 0:
            relevance = food[nutrient] / ref_value
            relevances.append((nutrient, relevance, food[nutrient]))
    
    # Sort by relevance descending and get top 3
    relevances.sort(key=lambda x: x[1], reverse=True)
    top_three = relevances[:3]
    
    # Return as dict with nutrient names as keys and values
    result = {}
    for nutrient, _, value in top_three:
        result[nutrient] = value
    
    return result

def main():
    response = supabase.table("foods").select("*").is_("visual_category", "null").execute()
    foods_to_update = response.data
    print(f"Found {len(foods_to_update)} foods to update")
    for food in tqdm(foods_to_update, desc="Processing foods"):
        if not check_usage_limits():
            return
        try:
            response = requests.post(f"{URL}/api/calculate/nutrition", json={
                "nutritionEngineArgs": {
                    "food": {"food": food},
                    "useGpt": False,
                    "logToReport": True,
                    "considerProcessing": False
                }
            })
            fullReport = response.json()["fullReport"]
            report = response.json()["nutritionComputed"]["report"]


            primary_name = food["primary_name"]
            referencing_food_names_results = supabase.table("food_names").select("name").eq("food_id", food["id"]).execute().data
            referencing_food_names = [result["name"] for result in referencing_food_names_results]
            nutrition_label = {
                "kcal": food["kcal"],
                "carbohydrates": food["carbohydrates"],
                "sugar": food["sugar"],
                "fiber": food["fiber"],
                "protein": food["protein"],
                "fat": food["fat"],
                "saturated_fat": food["saturated_fat"],
                "salt": food["salt"],
                "nova": food["nova"],
                **getTopThreeMicros(food)
            }
            health_report = {
                "overall_score": food["hidx"],
                "fiber_score": food["fiber_score"],
                "protein_score": food["protein_score"],
                "satiety_score": food["satiety"],
                "micronutrient_score": food["mnidx"],
                "fat_profile_score": food["fat_profile_score"],
                "protein_quality_score": round(fullReport["protein"]["proteinQualityScore"]),
                "polyphenol_score": food["polyphenols"],
                "carotenoid_score": food["carotenoids"],
                "glucosinolates_score": food["glucosinolates"],
            }
            prompt_formatted = prompt.replace("{primary_name}", primary_name).replace("{nutrition_label}", json.dumps(nutrition_label)).replace("{referencing_foods}", str(referencing_food_names)).replace("{health_report}", json.dumps(health_report))
            
            gpt_response = gpt.responses.create(
                model="gpt-5-mini",
                input=prompt_formatted,
                reasoning={"effort": "low"},
            )
            
            response_text = gpt_response.output_text
            
            extracted_data = extract_json(response_text)

            add_swaps(extracted_data["suggested_healthier_swaps"], food["id"], food["hidx"])
            supabase.table("foods").update({"visual_category": extracted_data["visual_category"], "description": extracted_data["description"], "report": report}).eq("id", food["id"]).execute()
                
        except Exception as e:
            raise e
            print(f"Error processing {food['primary_name']}: {str(e)}")
            continue

if __name__ == "__main__":
    main()