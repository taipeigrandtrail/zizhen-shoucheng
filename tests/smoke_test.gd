extends SceneTree

var failures: Array[String] = []


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var scene: Variant = load("res://main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	await process_frame

	_check(scene.slots.size() == 12, "棋盤應有 12 個格子")
	_check(scene.food == 30, "開局應有 30 個饅頭")

	var initial_food: int = scene.food
	scene._on_recruit_pressed()
	_check(scene.food == initial_food - 10, "招募應扣除 10 個饅頭")
	_check(not scene.slots[0].is_empty(), "招募後第一格應有單位")

	var test_unit := {"glyph": "刀", "name": "刀兵", "damage": 4, "level": 1}
	scene.slots[0].set_unit(test_unit)
	scene.slots[1].set_unit(test_unit)
	scene._on_slot_dropped(0, 1)
	_check(scene.slots[0].is_empty(), "合成後來源格應清空")
	_check(int(scene.slots[1].unit_data.level) == 2, "兩個 1 星單位應合成 2 星")

	scene._spawn_enemy()
	_check(scene.enemies.size() == 1, "應能產生敵人")
	var enemy_health: float = scene.enemies[0].health
	scene._attack_front_enemy()
	_check(scene.enemies[0].health < enemy_health, "文字兵應能自動攻擊敵人")

	if failures.is_empty():
		print("SMOKE_TEST_OK: 招募、合成、敵人與攻擊流程正常")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)


func _check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
