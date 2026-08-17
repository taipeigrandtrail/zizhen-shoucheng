extends Control

const UnitSlotScene := preload("res://scripts/unit_slot.gd")

const BOARD_SIZE := 12
const RECRUIT_COST := 10
const MAX_LEVEL := 3
const MAX_WAVE := 10

const UNIT_TYPES := [
	{"glyph": "刀", "name": "刀兵", "damage": 4, "color": Color("d65f5f")},
	{"glyph": "槍", "name": "槍兵", "damage": 5, "color": Color("d49a47")},
	{"glyph": "弓", "name": "弓兵", "damage": 3, "color": Color("61a7d7")},
	{"glyph": "騎", "name": "騎兵", "damage": 7, "color": Color("8c70c9")},
]

var rng := RandomNumberGenerator.new()
var slots: Array[UnitSlot] = []
var enemies: Array[Dictionary] = []

var food: int = 30
var base_health: int = 3
var wave: int = 1
var wave_pending: int = 0
var defeated_count: int = 0
var elapsed_time: float = 0.0
var passive_food_clock: float = 0.0
var spawn_clock: float = 0.0
var attack_clock: float = 0.0
var intermission: float = 0.0
var game_over: bool = false
var game_won: bool = false

var food_label: Label
var wave_label: Label
var base_label: Label
var enemy_count_label: Label
var enemy_list: VBoxContainer
var board_grid: GridContainer
var recruit_button: Button
var status_label: Label
var total_attack_label: Label
var restart_button: Button
var overlay: ColorRect
var overlay_title: Label
var overlay_detail: Label


func _ready() -> void:
	rng.randomize()
	_build_ui()
	_start_game()


func _process(delta: float) -> void:
	if game_over:
		return

	elapsed_time += delta
	passive_food_clock += delta
	spawn_clock += delta
	attack_clock += delta

	if passive_food_clock >= 1.5:
		passive_food_clock -= 1.5
		food += 1

	_process_enemies(delta)
	_process_spawning(delta)

	if attack_clock >= 0.45:
		attack_clock -= 0.45
		_attack_front_enemy()

	_refresh_hud()


func _build_ui() -> void:
	var background := ColorRect.new()
	background.color = Color("0e151d")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var safe_margin := MarginContainer.new()
	safe_margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	safe_margin.add_theme_constant_override("margin_left", 18)
	safe_margin.add_theme_constant_override("margin_right", 18)
	safe_margin.add_theme_constant_override("margin_top", 20)
	safe_margin.add_theme_constant_override("margin_bottom", 18)
	add_child(safe_margin)

	var page := VBoxContainer.new()
	page.add_theme_constant_override("separation", 10)
	safe_margin.add_child(page)

	var title := Label.new()
	title.text = "字陣守城"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color("f2d188"))
	page.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "招募文字兵・拖曳合成・守住城門"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color("9db0bd"))
	page.add_child(subtitle)

	var stats_panel := PanelContainer.new()
	stats_panel.add_theme_stylebox_override("panel", _panel_style(Color("18232e"), Color("344959"), 10))
	page.add_child(stats_panel)

	var stats := HBoxContainer.new()
	stats.add_theme_constant_override("separation", 8)
	stats_panel.add_child(stats)
	food_label = _make_stat_label()
	wave_label = _make_stat_label()
	base_label = _make_stat_label()
	enemy_count_label = _make_stat_label()
	stats.add_child(food_label)
	stats.add_child(wave_label)
	stats.add_child(base_label)
	stats.add_child(enemy_count_label)

	var lane_panel := PanelContainer.new()
	lane_panel.custom_minimum_size = Vector2(0, 184)
	lane_panel.add_theme_stylebox_override("panel", _panel_style(Color("111c24"), Color("2d4656"), 12))
	page.add_child(lane_panel)

	var lane_margin := MarginContainer.new()
	lane_margin.add_theme_constant_override("margin_left", 12)
	lane_margin.add_theme_constant_override("margin_right", 12)
	lane_margin.add_theme_constant_override("margin_top", 10)
	lane_margin.add_theme_constant_override("margin_bottom", 10)
	lane_panel.add_child(lane_margin)

	var lane_column := VBoxContainer.new()
	lane_column.add_theme_constant_override("separation", 6)
	lane_margin.add_child(lane_column)

	var lane_title := Label.new()
	lane_title.text = "敵軍路線　前線 ───────── 城門"
	lane_title.add_theme_font_size_override("font_size", 14)
	lane_title.add_theme_color_override("font_color", Color("d8e3e9"))
	lane_column.add_child(lane_title)

	enemy_list = VBoxContainer.new()
	enemy_list.add_theme_constant_override("separation", 6)
	lane_column.add_child(enemy_list)

	total_attack_label = Label.new()
	total_attack_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	total_attack_label.add_theme_font_size_override("font_size", 13)
	total_attack_label.add_theme_color_override("font_color", Color("8fc5a5"))
	lane_column.add_child(total_attack_label)

	var board_header := HBoxContainer.new()
	page.add_child(board_header)
	var board_title := Label.new()
	board_title.text = "我方字陣（拖曳到相同文字即可升星）"
	board_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	board_title.add_theme_font_size_override("font_size", 15)
	board_title.add_theme_color_override("font_color", Color("e5edf1"))
	board_header.add_child(board_title)

	board_grid = GridContainer.new()
	board_grid.columns = 4
	board_grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	board_grid.add_theme_constant_override("h_separation", 7)
	board_grid.add_theme_constant_override("v_separation", 7)
	page.add_child(board_grid)

	for index in BOARD_SIZE:
		var slot := UnitSlotScene.new() as UnitSlot
		slot.slot_index = index
		slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		slot.unit_dropped.connect(_on_slot_dropped)
		board_grid.add_child(slot)
		slots.append(slot)

	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 10)
	page.add_child(action_row)

	recruit_button = Button.new()
	recruit_button.text = "招募文字兵（%d 饅頭）" % RECRUIT_COST
	recruit_button.custom_minimum_size = Vector2(0, 58)
	recruit_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	recruit_button.add_theme_font_size_override("font_size", 18)
	recruit_button.add_theme_color_override("font_color", Color("2c2013"))
	recruit_button.add_theme_stylebox_override("normal", _button_style(Color("e7bd63"), Color("f4d68c")))
	recruit_button.add_theme_stylebox_override("hover", _button_style(Color("f1ca72"), Color("fff0bb")))
	recruit_button.add_theme_stylebox_override("pressed", _button_style(Color("c99b44"), Color("e7bd63")))
	recruit_button.pressed.connect(_on_recruit_pressed)
	action_row.add_child(recruit_button)

	status_label = Label.new()
	status_label.text = ""
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status_label.custom_minimum_size = Vector2(0, 42)
	status_label.add_theme_font_size_override("font_size", 14)
	status_label.add_theme_color_override("font_color", Color("b9c8d0"))
	page.add_child(status_label)

	_build_overlay()


func _build_overlay() -> void:
	overlay = ColorRect.new()
	overlay.color = Color(0.03, 0.05, 0.07, 0.92)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.visible = false
	add_child(overlay)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.add_child(center)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(430, 310)
	card.add_theme_stylebox_override("panel", _panel_style(Color("17232d"), Color("d3aa54"), 18))
	center.add_child(card)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 28)
	margin.add_theme_constant_override("margin_right", 28)
	margin.add_theme_constant_override("margin_top", 28)
	margin.add_theme_constant_override("margin_bottom", 28)
	card.add_child(margin)

	var column := VBoxContainer.new()
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.add_theme_constant_override("separation", 18)
	margin.add_child(column)

	overlay_title = Label.new()
	overlay_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_title.add_theme_font_size_override("font_size", 34)
	overlay_title.add_theme_color_override("font_color", Color("f2d188"))
	column.add_child(overlay_title)

	overlay_detail = Label.new()
	overlay_detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	overlay_detail.add_theme_font_size_override("font_size", 17)
	overlay_detail.add_theme_color_override("font_color", Color("d6e0e5"))
	column.add_child(overlay_detail)

	restart_button = Button.new()
	restart_button.text = "再玩一次"
	restart_button.custom_minimum_size = Vector2(250, 58)
	restart_button.add_theme_font_size_override("font_size", 19)
	restart_button.pressed.connect(_start_game)
	column.add_child(restart_button)


func _start_game() -> void:
	for enemy in enemies:
		if is_instance_valid(enemy.get("node")):
			enemy.node.queue_free()
	enemies.clear()
	for slot in slots:
		slot.clear_unit()

	food = 30
	base_health = 3
	wave = 1
	wave_pending = _enemy_count_for_wave(wave)
	defeated_count = 0
	elapsed_time = 0.0
	passive_food_clock = 0.0
	spawn_clock = 1.3
	attack_clock = 0.0
	intermission = 0.0
	game_over = false
	game_won = false
	overlay.visible = false
	recruit_button.disabled = false
	_show_status("先招募幾個文字兵，再拖曳相同文字進行合成。")
	_refresh_hud()


func _on_recruit_pressed() -> void:
	if game_over:
		return
	if food < RECRUIT_COST:
		_show_status("饅頭不足；每 1.5 秒會自動增加 1 個，擊敗敵人也會獲得。")
		return

	var empty_slot := _find_empty_slot()
	if empty_slot == null:
		_show_status("棋盤已滿。拖曳相同文字合成，才能騰出空格。")
		return

	food -= RECRUIT_COST
	var template: Dictionary = UNIT_TYPES[rng.randi_range(0, UNIT_TYPES.size() - 1)]
	var unit := template.duplicate(true)
	unit.level = 1
	empty_slot.set_unit(unit)
	_show_status("招募到「%s」！找另一個相同文字就能升星。" % unit.glyph)
	_refresh_hud()


func _on_slot_dropped(from_index: int, to_index: int) -> void:
	if game_over or from_index < 0 or to_index < 0 or from_index >= slots.size() or to_index >= slots.size():
		return

	var source := slots[from_index]
	var target := slots[to_index]
	if source.is_empty():
		return

	if target.is_empty():
		target.set_unit(source.unit_data)
		source.clear_unit()
		_show_status("已調整「%s」的位置。" % target.unit_data.glyph)
		return

	var same_type: bool = source.unit_data.get("glyph") == target.unit_data.get("glyph")
	var same_level: bool = int(source.unit_data.get("level", 1)) == int(target.unit_data.get("level", 1))
	if same_type and same_level:
		var current_level := int(target.unit_data.get("level", 1))
		if current_level >= MAX_LEVEL:
			_show_status("這個單位已經是最高的 3 星。")
			return
		var merged := target.unit_data.duplicate(true)
		merged.level = current_level + 1
		target.set_unit(merged)
		source.clear_unit()
		food += 2
		_show_status("合成成功：「%s」升為 %d 星！" % [merged.glyph, merged.level])
	else:
		_show_status("只能把相同文字、相同星級的單位合成。")


func _process_spawning(delta: float) -> void:
	if wave_pending > 0:
		if spawn_clock >= 2.1:
			spawn_clock = 0.0
			_spawn_enemy()
			wave_pending -= 1
		return

	if not enemies.is_empty():
		return

	if wave >= MAX_WAVE:
		_finish_game(true)
		return

	if intermission <= 0.0:
		intermission = 2.5
		food += 8
		_show_status("第 %d 波守住了！獎勵 8 個饅頭。" % wave)
	else:
		intermission -= delta
		if intermission <= 0.0:
			wave += 1
			wave_pending = _enemy_count_for_wave(wave)
			spawn_clock = 1.2
			_show_status("第 %d 波開始！" % wave)


func _spawn_enemy() -> void:
	var is_boss := wave % 5 == 0 and wave_pending == 1
	var max_health := float(24 + wave * 12)
	if is_boss:
		max_health *= 4.0

	var enemy := {
		"name": "敵將" if is_boss else "敵兵",
		"health": max_health,
		"max_health": max_health,
		"progress": 0.0,
		"speed": 0.032 + wave * 0.0015,
		"reward": 15 if is_boss else 5 + int(wave / 3),
		"boss": is_boss,
	}
	enemy.node = _create_enemy_row(enemy)
	enemies.append(enemy)


func _create_enemy_row(enemy: Dictionary) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 7)
	enemy_list.add_child(row)

	var name_label := Label.new()
	name_label.text = "Boss" if enemy.boss else "兵"
	name_label.custom_minimum_size = Vector2(50, 0)
	name_label.add_theme_color_override("font_color", Color("f0a081") if enemy.boss else Color("e2e8eb"))
	row.add_child(name_label)

	var health_bar := ProgressBar.new()
	health_bar.name = "Health"
	health_bar.min_value = 0
	health_bar.max_value = enemy.max_health
	health_bar.value = enemy.health
	health_bar.show_percentage = false
	health_bar.custom_minimum_size = Vector2(130, 18)
	health_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(health_bar)

	var progress_bar := ProgressBar.new()
	progress_bar.name = "Progress"
	progress_bar.min_value = 0
	progress_bar.max_value = 100
	progress_bar.value = 0
	progress_bar.show_percentage = false
	progress_bar.custom_minimum_size = Vector2(160, 18)
	progress_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(progress_bar)

	return row


func _process_enemies(delta: float) -> void:
	for enemy in enemies.duplicate():
		enemy.progress += enemy.speed * delta
		_update_enemy_row(enemy)
		if enemy.progress >= 1.0:
			base_health -= 1
			_remove_enemy(enemy)
			_show_status("有敵人闖入城門！剩餘 %d 點城防。" % base_health)
			if base_health <= 0:
				_finish_game(false)
				return


func _attack_front_enemy() -> void:
	if enemies.is_empty():
		return

	var attack := _calculate_total_attack()
	if attack <= 0:
		return

	var target := enemies[0]
	for enemy in enemies:
		if enemy.progress > target.progress:
			target = enemy

	target.health -= attack * 0.45
	_update_enemy_row(target)
	if target.health <= 0:
		food += int(target.reward)
		defeated_count += 1
		var defeated_name: String = "Boss" if target.boss else "敵兵"
		_remove_enemy(target)
		_show_status("擊敗%s，獲得 %d 個饅頭。" % [defeated_name, int(target.reward)])


func _update_enemy_row(enemy: Dictionary) -> void:
	var row = enemy.get("node")
	if not is_instance_valid(row):
		return
	var health_bar := row.get_node("Health") as ProgressBar
	var progress_bar := row.get_node("Progress") as ProgressBar
	health_bar.value = maxf(enemy.health, 0.0)
	progress_bar.value = clampf(enemy.progress * 100.0, 0.0, 100.0)


func _remove_enemy(enemy: Dictionary) -> void:
	if is_instance_valid(enemy.get("node")):
		enemy.node.queue_free()
	enemies.erase(enemy)


func _calculate_total_attack() -> float:
	var total := 0.0
	for slot in slots:
		if slot.is_empty():
			continue
		var level := int(slot.unit_data.get("level", 1))
		total += float(slot.unit_data.get("damage", 1)) * pow(2.0, level - 1)
	return total


func _find_empty_slot() -> UnitSlot:
	for slot in slots:
		if slot.is_empty():
			return slot
	return null


func _enemy_count_for_wave(target_wave: int) -> int:
	return 4 + target_wave


func _finish_game(won: bool) -> void:
	if game_over:
		return
	game_over = true
	game_won = won
	recruit_button.disabled = true
	overlay.visible = true
	overlay_title.text = "守城成功！" if won else "城門失守"
	overlay_detail.text = "你撐過 10 波，擊敗 %d 名敵軍。\n這代表核心玩法已經可以運作。" % defeated_count if won else "你守到第 %d 波，擊敗 %d 名敵軍。\n再試著更早合成高星單位。" % [wave, defeated_count]


func _refresh_hud() -> void:
	food_label.text = "饅頭\n%d" % food
	wave_label.text = "波次\n%d/%d" % [wave, MAX_WAVE]
	base_label.text = "城防\n%s" % "❤".repeat(maxi(base_health, 0))
	enemy_count_label.text = "敵軍\n%d" % (enemies.size() + wave_pending)
	total_attack_label.text = "字陣總攻擊：%d" % int(_calculate_total_attack())
	recruit_button.disabled = game_over or food < RECRUIT_COST


func _show_status(message: String) -> void:
	status_label.text = message


func _make_stat_label() -> Label:
	var label := Label.new()
	label.custom_minimum_size = Vector2(0, 56)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color("dce5e9"))
	return label


func _panel_style(background: Color, border: Color, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(2)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style


func _button_style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(2)
	style.set_corner_radius_all(12)
	return style

