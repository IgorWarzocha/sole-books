TAX_YEAR ?= 2026-27
DATA_DIR := data/$(TAX_YEAR)

.PHONY: summary cashflow views check

summary:
	python3 bin/summary $(DATA_DIR)

cashflow:
	python3 bin/cashflow $(DATA_DIR)

views:
	python3 bin/views $(DATA_DIR)

check:
	python3 bin/summary $(DATA_DIR) --check
	python3 bin/cashflow $(DATA_DIR) --check
	python3 -m unittest discover -s bin -p 'test_*.py'
