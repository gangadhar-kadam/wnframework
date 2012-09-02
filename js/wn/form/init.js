// Copyright (c) 2012 Web Notes Technologies Pvt Ltd (http://erpnext.com)
// 
// MIT License (MIT)
// 
// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

wn.ui.make_control = function(opts) {
	control_map = {
		'Check': wn.ui.CheckControl,
		'Data': wn.ui.Control,
		'Int': wn.ui.IntControl,
		'Float': wn.ui.FloatControl,
		'Currency': wn.ui.CurrencyControl,
		'Link': wn.ui.LinkControl,
		'Select': wn.ui.SelectControl,
		'Table': wn.ui.GridControl,
		'Text': wn.ui.TextControl,
		'Small Text': wn.ui.TextControl,
		'Text Editor': wn.ui.RichTextControl,
		'Button': wn.ui.ButtonControl,
		'Date': wn.ui.DateControl,
		'Code': wn.ui.CodeControl
	}
	if(control_map[opts.docfield.fieldtype]) {
		return new control_map[opts.docfield.fieldtype](opts);
	} else {
		return null;		
	}
}

wn.ui.Control = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.setup_perm();
		this.make();
		this.set_events();
		this.apply_disabled();
		this.apply_hidden();
		this.apply_mandatory();
		this.set_change_event();
	},
	setup_perm: function() {
		this.perm = this.doclist ? this.doclist.get_perm()[this.docfield.permlevel] : [1,1];
		if(!this.perm) {
			this.perm = [0, 0]
		}		
	},
	make: function() {
		if(this.docfield.vertical) {
			this.make_body_vertical();			
		} else {
			this.make_body();			
		}
		this.make_input();
		this.make_label();
		
		// set tabIndex
		this.$input && this.$input.attr("tabIndex", this.docfield.idx);
	},
	trigger_make_event: function() {
		var ev_name = "";
		if(this.doc && this.form && this.doc.get('parent')) {
			// trigger event on parent form
			ev_name = 'make ' + this.doc.get('parentfield') + ' ' + this.docfield.fieldname;
			this.form.parent_form.trigger(ev_name, this);
		} else if(this.doc) {
			// trigger event on this form
			ev_name = 'make ' + this.docfield.fieldname;
			this.form.trigger(ev_name, this);
		}
	},
	make_label: function() {
		// label and description
		if(this.docfield.label)
			this.$w.find('label:first').text(this.docfield.label).attr("title", this.docfield.fieldname);
		if(this.no_label) {
			this.hide_label();
		} else {
			if(this.docfield.description) {
				this.help_block(this.docfield.description);
			}
		}		
	},
	set_change_event: function() {
		var me = this;
		if(this.$input) 
			this.$input.change(function() {
				me.set(me.get())
			});
	},
	set: function(val) {
		if(this.validate) {
			var val = this.validate(val);
		}
		if(this.doc) {
			this.doc.set(this.docfield.fieldname, val);					
		}
		this.set_static(val);
	},
	get_doc_val: function() {
		if(this.doc && this.docfield.fieldname) {
			return this.doc.get(this.doc.fieldname);
		}
	},
	set_events: function() {
		var me = this;
		this.$w.find('.control-static').click(function() {
			me.toggle_editable(true);
		});
	},
	toggle_input: function(show) {
		this.$input && this.$input.toggle(show);
		this.toggle_static(!show);
	},
	toggle_static: function(show) {
		this.$w.find('.control-static').toggle(show);
	},
	set_init_value: function() {
		if(this.doc) {
			var val = this.doc.get(this.docfield.fieldname);
			this.set_input(val);
			
			if(this.get() != val) {
				// validated by control
				this.set(this.get())
			} else {
				this.doclist.trigger_change_event(this.docfield.fieldname, this.get(), this.doc);	
			}
			this.doc_initialized = true;
		}
	},
	hide_label: function() {
		this.$w.find('.control-label').toggle(false);
	},
	set_input: function(val) {
		this.$input.val(val).change();
		this.set_static(val);
	},
	as_inline: function() {
		this.$w.css('display', 'inline');
		this.$w.find('div.controls').css('display', 'inline');
	},
	set_static: function(val) {
		this.$w.find('.control-static').html(val);
	},
	get: function() {
		return this.$input.val();
	},
	get_value: function() {
		return this.get();
	},
	make_input: function() {
		this.$input = $('<input type="text">').appendTo(this.$w.find('.controls'));
	},
	make_body: function() {
		this.$w = $('<div class="control-group">\
			<label class="control-label"></label>\
			<div class="controls">\
				<div class="control-static" style="display: none"></div>\
			</div>\
			</div>').appendTo(this.parent);
	},
	make_body_vertical: function() {
		this.$w = $('<div class="control-group">\
			<div class="vertical-label"><label></label></div>\
			<div class="controls" style="margin-left: 0px;">\
				<div class="control-static" style="display: none"></div>\
			</div>\
			</div>').appendTo(this.parent);
		
		// if no label, remove whitespace
		if(!this.docfield.label) {
			this.$w.find('.vertical-label').toggle(false);
		}
	},
	help_block: function(text) {
		if(!text) return;
		if(!this.$w.find('.help-block').length) {
			this.$w.find('.controls').append('<div class="help-block">');
		}
		this.$w.find('.help-block').html(text);
	},
	apply_hidden: function() {
		this.$w.toggle(!this.get_hidden());
	},
	get_hidden: function() {
		return this.docfield.hidden || !this.perm[READ]
	},
	apply_disabled: function() {
		this.set_disabled(this.get_disabled());
	},
	get_disabled: function() {
		return this.docfield.disabled || (!this.perm[WRITE]) 
			|| (this.doclist && this.doclist.doc.get('docstatus',0) > 0);
	},
	set_disabled: function(disabled) {
		this.$input.attr('disabled', disabled ? 'disabled' : null);
	},
	apply_mandatory: function() {
		var me = this;
		if(this.docfield.reqd) {
			this.$input.change(function() {
				$(me.$w).toggleClass('error', !me.get());
			});
		}
	},
});