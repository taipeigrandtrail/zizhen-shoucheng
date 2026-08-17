class_name UnitSlot
extends Panel

signal unit_dropped(from_index: int, to_index: int)

var slot_index: int = -1
var unit_data: Dictionary = {}

var glyph_label: Label
var level_label: Label
var stat_label: Label

var empty_style := StyleBoxFlat.new()
var filled_style := StyleBoxFlat.new()


func _ready() -> void:
	custom_minimum_size = Vector2(112, 92)
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_build_styles()
	_build_content()
	refresh()


func _build_styles() -> void:
	empty_style.bg_color = Color("18212b")
	empty_style.border_color = Color("394958")
	empty_style.set_border_width_all(2)
	empty_style.set_corner_radius_all(10)

	filled_style.bg_color = Color("f2e7ca")
	filled_style.border_color = Color("d7ad52")
	filled_style.set_border_width_all(3)
	filled_style.set_corner_radius_all(10)


func _build_content() -> void:
	var column := VBoxContainer.new()
	column.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 6)
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(column)

	glyph_label = Label.new()
	glyph_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	glyph_label.add_theme_font_size_override("font_size", 34)
	glyph_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(glyph_label)

	level_label = Label.new()
	level_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_label.add_theme_font_size_override("font_size", 15)
	level_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(level_label)

	stat_label = Label.new()
	stat_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stat_label.add_theme_font_size_override("font_size", 12)
	stat_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(stat_label)


func set_unit(data: Dictionary) -> void:
	unit_data = data.duplicate(true)
	refresh()


func clear_unit() -> void:
	unit_data = {}
	refresh()


func is_empty() -> bool:
	return unit_data.is_empty()


func refresh() -> void:
	if glyph_label == null:
		return

	if unit_data.is_empty():
		add_theme_stylebox_override("panel", empty_style)
		glyph_label.text = "＋"
		glyph_label.modulate = Color("5f7383")
		level_label.text = "空格"
		level_label.modulate = Color("708596")
		stat_label.text = ""
		return

	add_theme_stylebox_override("panel", filled_style)
	glyph_label.text = str(unit_data.get("glyph", "兵"))
	glyph_label.modulate = Color("392d21")
	var level := int(unit_data.get("level", 1))
	level_label.text = "★".repeat(level)
	level_label.modulate = Color("a96d05")
	stat_label.text = "攻擊 %d" % int(unit_data.get("damage", 1) * pow(2.0, level - 1))
	stat_label.modulate = Color("6b5334")


func _get_drag_data(_at_position: Vector2) -> Variant:
	if unit_data.is_empty():
		return null

	var preview := PanelContainer.new()
	preview.custom_minimum_size = Vector2(72, 72)
	var style := StyleBoxFlat.new()
	style.bg_color = Color("fff0c2")
	style.border_color = Color("e0a83b")
	style.set_border_width_all(3)
	style.set_corner_radius_all(12)
	preview.add_theme_stylebox_override("panel", style)

	var preview_label := Label.new()
	preview_label.text = "%s\n%s" % [unit_data.get("glyph", "兵"), "★".repeat(int(unit_data.get("level", 1)))]
	preview_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	preview_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	preview_label.add_theme_font_size_override("font_size", 22)
	preview_label.add_theme_color_override("font_color", Color("392d21"))
	preview.add_child(preview_label)
	set_drag_preview(preview)

	return {"from_index": slot_index}


func _can_drop_data(_at_position: Vector2, data: Variant) -> bool:
	return data is Dictionary and data.has("from_index") and int(data.from_index) != slot_index


func _drop_data(_at_position: Vector2, data: Variant) -> void:
	unit_dropped.emit(int(data.from_index), slot_index)

