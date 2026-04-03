APPLIANCES = [
    "air fryer", "slow cooker", "instant pot", "pressure cooker",
    "thermomix", "sous vide", "blender", "food processor",
    "stand mixer", "waffle maker", "rice cooker", "dehydrator",
]


def extract_sld(url: str) -> str:
    try:
        hostname = urlparse(url).hostname or ""
        parts = hostname.lower().split(".")
        if parts and parts[0] == "www":
            parts = parts[1:]
        return parts[0] if parts else url
    except Exception:
        return url


def build_input_text(recipe: dict, foods: list, tags: list) -> str:
    lines = []

    lines.append(f"Recipe title: {recipe['title']}")

    if recipe.get("description"):
        lines.append(f"Description: {recipe['description']}")

    if foods:
        seen = set()
        unique_ingredients = []
        for f in foods:
            name = f["food_names"]["name"]
            if name not in seen:
                seen.add(name)
                unique_ingredients.append(name)
        lines.append(f"Ingredients: {', '.join(unique_ingredients)}")

    general_tags = [t for t in tags if t["tag_id"] < 300]
    cuisine_tags = [t for t in tags if t["tag_id"] >= 300]

    if general_tags:
        tag_names = ", ".join(t["tags"]["name"] for t in general_tags)
        lines.append(f"Tags: {tag_names}")

    if recipe.get("source_type") == "MEDIA" and recipe.get("source"):
        sld = extract_sld(recipe["source"])
        lines.append(f"Source: From a video on {sld}")

    if cuisine_tags:
        lines.append(f"Cuisine: {cuisine_tags[0]['tags']['name']} cuisine")

    if recipe.get("original_title"):
        lines.append(f"Original title on social media: {recipe['original_title']}")

    if recipe.get("instructions"):
        instructions_lower = " ".join(recipe["instructions"]).lower()
        found = [a for a in APPLIANCES if a in instructions_lower]
        if found:
            lines.append(f"Appliances: {', '.join(found)}")

    return "\n".join(lines)


def embed_and_insert(recipe_id: int, input_text: str) -> None:
    response = gpt.embeddings.create(
        model="text-embedding-3-small",
        input=input_text,
        dimensions=256,
    )
    embedding = response.data[0].embedding
    supabase.table("recipes").update({"embedding": embedding}).eq("id", recipe_id).execute()


def main():
    query = supabase.table("recipes").select("id")
    if not OVERWRITE_EXISTING:
        query = query.is_("embedding", "null")
    recipe_ids = [r["id"] for r in query.execute().data]

    print(f"Found {len(recipe_ids)} recipes to process")

    # --- DRY RUN: print input text for the first recipe and exit ---
    if recipe_ids:
        first_id = recipe_ids[0]
        recipe = supabase.table("recipes").select("*").eq("id", first_id).single().execute().data
        foods = supabase.table("recipe_foods").select("*, food_names(name)").eq("recipe_id", first_id).execute().data
        tags = supabase.table("recipe_tags").select("*, tags(name, category)").eq("recipe_id", first_id).execute().data
        input_text = build_input_text(recipe, foods, tags)
        print(f"\n--- Input text for recipe {first_id} ---\n{input_text}\n")
    # --------------------------------------------------------------

    for recipe_id in tqdm(recipe_ids, desc="Embedding recipes"):
        try:
            recipe = supabase.table("recipes").select("*").eq("id", recipe_id).single().execute().data
            foods = supabase.table("recipe_foods").select("*, food_names(name)").eq("recipe_id", recipe_id).execute().data
            tags = supabase.table("recipe_tags").select("*, tags(name, category)").eq("recipe_id", recipe_id).execute().data
            input_text = build_input_text(recipe, foods, tags)
            embed_and_insert(recipe_id, input_text)
        except Exception as e:
            print(f"Error processing recipe {recipe_id}: {e}")
            continue


if __name__ == "__main__":
    main()
