PY := python3
VENV := .venv
PORT ?= 8000

.PHONY: venv install clean

venv:
	$(PY) -m venv $(VENV)
	@echo "Run: source $(VENV)/bin/activate"

install:
	. $(VENV)/bin/activate && python -m pip install -U pip && pip install -r requirements.txt

run:
	. $(VENV)/bin/activate && \
	export DJANGO_SETTINGS_MODULE=settings && \
	python manage.py migrate && \
	python manage.py runserver 0.0.0.0:$(PORT)

.PHONY: who-uses-port kill-port
who-uses-port:
	lsof -nP -iTCP:$(PORT) | grep LISTEN || true

kill-port:
	@pids=$$(lsof -tn -iTCP:$(PORT) -sTCP:LISTEN || true); \
	if [ -n "$$pids" ]; then echo "Killing $$pids"; kill -9 $$pids; else echo "No process on port $(PORT)"; fi

clean:
	rm -rf $(VENV)
