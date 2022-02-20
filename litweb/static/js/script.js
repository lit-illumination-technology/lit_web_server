let g_selectedRanges = [];
let g_argControls = {};

let g_effectSelector;
let g_speedSlider;
let g_overlayedToggle;
let g_opacityContainer;
let g_opacitySlider;
let g_backButton;
let g_forwardButton;
let g_sendButton;
let g_offButton;
let g_onButton;

function componentToHex(c) {
	let hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
	return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}


function schemaToComponent(name, schemaElement, argFuncs, colors, colorTypes) {
	const type = schemaElement.value.type;
	const mainDiv = $('<div/>', { 'class': 'row' });
	mainDiv.append($('<div/>', {'class': 'col-sm-4'}));
	const controlDiv = $('<div/>', {'class': 'panel panel-default'});
	controlDiv.append($('<div/>', {'class': 'panel-heading', text: name}));
	mainDiv.append($('<div/>', {'class': 'col-sm-4 centered_hor'}).append(controlDiv));
	mainDiv.append($('<div/>', {'class': 'col-sm-4'}));
	if (type == 'number') {
		const slider = $('<input/>', {id: 'input_'+name, type: 'text', 'data-slider-value': schemaElement.value.default, 'data-slider-min': schemaElement.value.min, 'data-slider-max': schemaElement.value.max, 'data-slider-step': 0.1});
		controlDiv.append($('<div/>', {'class': 'panel-body'}).append(slider));
		slider.slider();
		argFuncs[name] = function(s) {
			return function() {
				return parseInt(s.slider("getValue"))
			}
		}(slider);
		return controlDiv;
	}
	else if (type == 'color') {
		const colorTypeSelector = $('<select id="color_type_selector"></select>')
		$.each(colorTypes, function() {
			colorTypeSelector.append($("<option />").val(JSON.stringify({"name": this.name, "schema": this.schema})).text(this.name));
		});
		const colorArgsDiv = $('<div/>', {'class': 'panel-body'});
		controlDiv.append($('<div/>', {'class': 'panel-body'}).append(colorTypeSelector).append(colorArgsDiv));

		const colorArgFuncs = {};

		colorTypeSelector.change(function() {
			colorArgsDiv.empty();
			const colorArgFuncs = {};
			console.log(colorTypeSelector.val());
			const schema = $.parseJSON(colorTypeSelector.val()).schema;
            if ($.isEmptyObject(schema)) {
                colorArgsDiv.hide()
            } else {
                colorArgsDiv.show()
                for (i in schema) {
                    component = schemaToComponent(i, schema[i], colorArgFuncs, colors, colorTypes);
                    colorArgsDiv.append(component);
                }
            }
		});
		argFuncs[name] = function (selector){
			return function() {
				const args = {};
				for (control in colorArgFuncs) {
					args[control] = colorArgFuncs[control]();
				}
				return {type: $.parseJSON(colorTypeSelector.val()).name, args: args};
			}
		}(colorTypeSelector);
        colorTypeSelector.trigger('change');
		return controlDiv;
	} else if (type == 'rgb') {
		const start_color = schemaElement.value.default || [255, 255, 255];
		const colorSelector = $('<input/>', {id: 'input_'+name, 'class': 'form-control colorpicker-element', type: 'text', 'data-format': 'hex', 'value': rgbToHex(start_color)});
		colorSelector.colorpicker({
				colorSelectors : colors,
				template: '<div class="colorpicker dropdown-menu">' +
				  '<div class="colorpicker-saturation"><i><b></b></i></div>' +
				  '<div class="colorpicker-hue"><i></i></div>' +
				  '<div class="colorpicker-alpha"><i></i></div>' +
				  '<div class="colorpicker-color"></div></div>' +
				  '</div>',
		});
		argFuncs[name] = function (selector){
			return function() {
				const rgba = selector.data('colorpicker').color.toRGB();
				return [rgba['r'], rgba['g'], rgba['b']];
			}
		}(colorSelector);
		controlDiv.append(colorSelector);
		return controlDiv;
	} else if (type == 'choices') {
		const choiceSelector = $('<select/>', {id: 'input_'+name});
		$.each(schemaElement.value.choices, function() {
			choiceSelector.append($("<option />").text(this));
		});
		controlDiv.append($('<div/>', {'class': 'panel-body'}).append(choiceSelector));
		argFuncs[name] = function(selector) {
			return function() {
				return selector.find(":selected").text();
			}
		}(choiceSelector);
		return controlDiv;
    }
}

function getEffects() {
    return $.ajax({
        url: "/api/v1/effects",
        dataType: "json",
    });
}

function getColorTypes() {
    return $.ajax({
        url: "/api/v1/color_types",
        dataType: "json"
	});
}

function getColors() {
    return $.ajax({
        url: "/api/v1/colors",
        dataType: "json"
	});
}

function getPresets() {
    return $.ajax({
        url: "/api/v1/presets",
        dataType: "json"
	});
}

function getRanges() {
    return $.ajax({
        url: "/api/v1/ranges",
        dataType: "json"
	});
}

function setupDynamicComponents(ranges, effects, presets, colorTypes, colors) {
    console.log("Loaded necessary data. Setting up components");
    console.log(effects);
	const hex_colors = {};

    //Populate the color selector
    $.each(colors, function() {
        hex_colors[this.name] = rgbToHex(this.rgb);
    });

	setupRanges(ranges);
	setupEffects(effects, hex_colors, colorTypes);
	setupPresets(presets);
}

function setupEffects(effects, colors, colorTypes) {
	$.each(effects, function() {
		g_effectSelector.append($("<option />").val(JSON.stringify({'schema': this.schema, 'defaultSpeed': this.default_speed})).text(this.name));
	});

    //When a different effect is chosen, hide/show appropriate options
    g_effectSelector.change(function() {
        $('#controls').empty();
        g_argControls = {};
        let effectInfo = $.parseJSON(g_effectSelector.val());
        g_speedSlider.slider('setValue', effectInfo.defaultSpeed)
        const controls = effectInfo.schema;
        for (i in controls) {
            component = schemaToComponent(i, controls[i], g_argControls, colors, colorTypes);
            controlDiv = $('<div/>', { 'class': 'row' });
            controlDiv.append($('<div/>', {'class': 'col-sm-4'}));
            controlDiv.append($('<div/>', {'class': 'col-sm-4 centered_hor'}).append(component));
            controlDiv.append($('<div/>', {'class': 'col-sm-4'}));
            $('#controls').append(controlDiv);
        }
    });
    
	//Update options for initially selected effect
	g_effectSelector.trigger("change");
}

function setupPresets(presets) {
    $.each(presets, function() {
        let button =$("<button />").prop("type", "button").prop("id", "preset_"+this).addClass("btn btn-primary preset-btn").text(this);
        $("#presets").append(button);
        let preset = this;
        button.click(function() {
            $.post({
				url: `/api/v1/presets/${preset}`,
				data: "{}",
				contentType: "application/json",
				dataType: 'json'
            }).done(function(data) {
            	if ( $(window).width() > 768) {
                	$("#result").html("")
                	$.notify({
                		// options
                		message: data.message
                	},{
                		// settings
                		type: 'success'
                	});
            	} 
            	else {
                	$("#result").html(data.message);
            	}
            });
        });
    });
}

function setupRanges(ranges) {
    $.each(ranges.sections, function() {
        const name = this;
        range_input = $("<input type='checkbox' data-toggle='toggle' data-off='" + name + "' data-on='" + name + "' data-width='72' data-height='32' checked>");
        g_selectedRanges.push(name);
        range_input.change(function(){
            if($(this).prop("checked")) {
                g_selectedRanges.push(name);
            }else {
                g_selectedRanges.splice(g_selectedRanges.indexOf(name), 1);
            }
        });
        const switch_container = $("<div class='toggle_container'></div>");
        range_input.appendTo(switch_container);
        switch_container.appendTo("#range_switches");
        range_input.bootstrapToggle();
    });
    $("#ranges_row").fadeIn();
}

$(document).ready(function(){
    g_effectSelector = $("#effect_selector");
    g_speedSlider = $("#speed_slider");
    g_speedSlider.slider();
    g_overlayedToggle = $("#overlayed_toggle");
    g_overlayedToggle.bootstrapToggle("off");
    g_opacityContainer = $("#opacity_container");
    g_opacitySlider = $("#opacity_slider");
    g_opacitySlider.slider();
    g_backButton = $("#back");
    g_forwardButton = $("#forward");
    g_sendButton = $("#send");
    g_offButton = $("#off");
    g_onButton = $("#on");

    $.when(getRanges(), getEffects(), getPresets(), getColorTypes(), getColors()).done(function (ranges, effects, presets, colorTypes, colors) {
        setupDynamicComponents(ranges[0], effects[0].effects, presets[0].presets, colorTypes[0].color_types, colors[0].colors);
        $("#main_container").show();
    }).fail(console.log);

    g_overlayedToggle.change(function(){
        if(g_overlayedToggle.prop("checked")) {
            g_opacityContainer.fadeIn();
        }else {
            g_opacityContainer.fadeOut();
        }
    });

    //Send the command
    g_sendButton.click(function(){
        let effect;
        let command;
        if(g_selectedRanges.length == 0){
            effect = "off";
            command = {
                effect: {
                   args: {"ranges": "all"},
                   properties: {overlayed: false}
                }
            }
        }
        else {
            let args = {};
            for (control in g_argControls) {
                args[control] = g_argControls[control]();
            }
            let overlayed = g_overlayedToggle.prop('checked');
            let opacity = overlayed? parseFloat(g_opacitySlider.slider('getValue')) : null;
            let speed = parseFloat(g_speedSlider.slider('getValue'));
            effect =  g_effectSelector.children("option").filter(":selected").text();
            command = {
                args : args,
                properties: {
                ranges: g_selectedRanges,
                speed: speed,
                overlayed: overlayed,
                opacity: opacity
                }
            };
        }
        $.post({
            url: `/api/v1/effects/${effect}`,
            data: JSON.stringify(command),
            contentType: "application/json",
            dataType: 'json'
        }).done(function(data) {
            if ( $(window).width() > 768) {
                $("#result").html("")
                $.notify({
                // options
                message: data.message
                },{
                // settings
                type: 'success'
                });
            } 
            else {
                $("#result").html(data.message)
            }
        });
    });

    g_backButton.click(function() {
        let request  = {
            "back": true
        };
        $.ajax({
        url: '/api/v1/history',
        type: 'post',
        data: JSON.stringify(request),
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
                if ( $(window).width() > 768) {
                    $("#result").html("");
                    $.notify({
                        // options
                        message: data.message
                    },{
                        // settings
                        type: 'success'
                    });
                } 
                else {
                    $("#result").html(data.message)
                }
            }
        });
    });

    g_forwardButton.click(function() {
        let request  = {
            "forward": true
        };
        $.ajax({
        url: '/api/v1/history',
        type: 'post',
        data: JSON.stringify(request),
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
                if ( $(window).width() > 768) {
                $("#result").html("")
                $.notify({
                    // options
                    message: data.message
                },{
                    // settings
                    type: 'success'
                });
                } 
                else {
                $("#result").html(data.message)
                }
            }
        });
    });
});

