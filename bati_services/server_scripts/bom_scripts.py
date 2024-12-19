import frappe
@frappe.whitelist()
def get_cost_breakdown_by_item_group():
    bom_name = frappe.form_dict.get("bom_name")

    bom_doc = frappe.get_doc("BOM", bom_name)

    cost_by_item_group = {}

    # Loop through all items in the BOM 
    for bom_item in bom_doc.items:
        # Fetch item details
        item_code = bom_item.item_code
        item_qty = bom_item.qty or 0
        item_rate = bom_item.base_rate or 0
        
        # Fetch the item document to get the item group
        item_doc = frappe.get_doc("Item", item_code)
        item_group = item_doc.item_group
        item_group_doc = frappe.get_doc("Item Group", item_group)
        margin_percent = item_group_doc.custom_margin

        # Calculate total cost for the item
        item_total_cost = item_qty * item_rate

        # Aggregate the cost by item group
        if item_group not in cost_by_item_group:
            cost_by_item_group[item_group] = {"total_cost": 0, "margin_percent": margin_percent}
        cost_by_item_group[item_group]["total_cost"] = cost_by_item_group[item_group]["total_cost"] + item_total_cost

    frappe.response["message"] = cost_by_item_group

@frappe.whitelist()
def create_quotation_from_bom():
    bom_name = frappe.form_dict.get("bom_name") 
    if not bom_name:
        
        frappe.throw("BOM Name is required")

    # Fetch the BOM document 
    bom_doc = frappe.get_doc("BOM", bom_name)

    # Create a new Quotation document
    quotation = frappe.new_doc("Quotation")


    # Add BOM finished item to the Quotation
    quotation.append("items", {
        "item_code": bom_doc.item_name,
        "qty": bom_doc.quantity,
        "uom": bom_doc.uom,
        "rate": bom_doc.custom_quote_price,
        "custom_total": bom_doc.custom_total,
        "custom_material_cost_with_margin": bom_doc.custom_total_with_margin,
        "custom_material_cost_without_margin": bom_doc.custom_total_without_margin,
        "custom_labour":bom_doc.custom_total_labour,
        "custom_total": bom_doc.custom_total,
        "custom_total_material_cost_with_margin": bom_doc.custom_total_with_margin,
        "custom_total_material_cost_without_margin": bom_doc.custom_total_without_margin,
        "custom_total_labour":bom_doc.custom_total_labour  
    })
            
        
    # Save and submit the Quotation
    quotation.insert()
    # quotation.submit()

    frappe.response["message"] = quotation.name