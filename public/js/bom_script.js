frappe.ui.form.on('BOM', {
    refresh: function(frm) {
        frm.add_custom_button(__('Create Quotation'), function() {
            // Server side script call
            frappe.call({
                method: "stcl_batiservices.bati_services.server_scripts.bom_scripts.create_quotation_from_bom",
                args: {
                    bom_name: frm.doc.name
                },
                callback: function(response) {
                    if (response.message) {
                        // Show a success message
                        frappe.set_route('Form', 'Quotation', response.message);
                    }
                }
            });
        }, __("Actions"));
    }
});

frappe.ui.form.on('BOM', {
    refresh: function (frm) {
        frm.add_custom_button(__('Calculate Cost Breakdwon'), function() {
            // Call the server-side function to get the cost breakdown
            frappe.call({
                method: "stcl_batiservices.bati_services.server_scripts.bom_scripts.get_cost_breakdown_by_item_group",
                args: {
                    bom_name: frm.doc.name
                },
                callback: function(response) {
                    if (response.message) {
                        const cost_breakdown = response.message;
    
                        // Clear existing rows in the child table
                        frm.clear_table("custom_cost_breakdown");
                        
                        let custom_total = 0;
                        let custom_total_labour = 0;
                        let custom_total_with_margin = 0;
                        let custom_total_without_margin = 0;
    
                        // Populate the child table with cost breakdown data
                        for (const [group, data] of Object.entries(cost_breakdown)) {
                            let child = frm.add_child("custom_cost_breakdown");
                            child.item_group = group;
                            child.cost = data.total_cost.toFixed(2);
                            child.margin = data.margin_percent || 1;
                            
                            // Calculate the total_cost based on margin
                            child.total_cost = ((child.margin) * child.cost).toFixed(2);
                            
                            // Calculate totals based on conditions
                            if (group.toLowerCase() === "labour") {
                                custom_total_labour = custom_total_labour + parseFloat(child.total_cost);
                            } else {
                                custom_total_with_margin = custom_total_with_margin + parseFloat(child.total_cost);
                                custom_total_without_margin = custom_total_without_margin + parseFloat(child.cost);
                            }
                            
                            // Update custom_total 
                            custom_total = custom_total + parseFloat(child.total_cost);
                        }
    
                        // Refresh the child table to show the changes
                        frm.refresh_field("custom_cost_breakdown");
                        
                        // Updaate the custom_total field
                        frm.set_value("custom_total", custom_total);
                        frm.set_value("custom_total_labour", custom_total_labour);
                        frm.set_value("custom_total_with_margin", custom_total_with_margin);
                        frm.set_value("custom_total_without_margin", custom_total_without_margin);
                    }
                }
            });
        }, __("Actions"));
    
    },
    // Trigger when value changes
    custom_total: function(frm) {
        frm.set_value('custom_quote_price', frm.doc.custom_total);
        
    }
});


frappe.ui.form.on('BOM Cost Breakdown', {
	margin: function(frm, cdt, cdn) {
	    // Get current child table
	    let row = locals[cdt][cdn];
	    
	    // Default margin to 1 if it's 0 or not set
	    let margin = row.margin || 1;
	    
	    // Recalculate cost_ based on the updated margin
	    if (row.cost) {
	        row.total_cost = ((row.margin) * row.cost).toFixed(2);
	    }
        frm.refresh_field("custom_cost_breakdown");
        
        // Recalculate custom_total
        let custom_total = 0;
        let custom_total_labour = 0;
        let custom_total_with_margin = 0;
        let custom_total_without_margin = 0;
        
        frm.doc.custom_cost_breakdown.forEach(function(row) {
            custom_total = custom_total + parseFloat(row.total_cost);
            
            if (row.item_group.toLowerCase() === "labour") {
                custom_total_labour = custom_total_labour + parseFloat(row.total_cost);
            } else {
                custom_total_with_margin = custom_total_with_margin + parseFloat(row.total_cost);
                custom_total_without_margin = custom_total_without_margin + parseFloat(row.cost);
            }
        });

        // Update the custom_total field
        frm.set_value("custom_total", custom_total);
        frm.set_value("custom_total_labour", custom_total_labour);
        frm.set_value("custom_total_with_margin", custom_total_with_margin);
        frm.set_value("custom_total_without_margin", custom_total_without_margin);
	}
});