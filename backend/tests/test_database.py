import sqlite3

from app.database import migrate_down, migrate_up


def test_migration_up_and_down(tmp_path):
    path = tmp_path / "migration.db"
    migrate_up(path)
    with sqlite3.connect(path) as db:
        assert db.execute("SELECT version FROM schema_version").fetchone()[0] == 5
        assert db.execute("SELECT name FROM sqlite_master WHERE name='sops'").fetchone()
        assert "follow_up_date" in {row[1] for row in db.execute("PRAGMA table_info(sops)")}
        assert "follow_up_start_date" in {row[1] for row in db.execute("PRAGMA table_info(sops)")}
        assert "follow_up_end_date" in {row[1] for row in db.execute("PRAGMA table_info(sops)")}
        assert "machine" in {row[1] for row in db.execute("PRAGMA table_info(sops)")}
        assert "steps_per_page" in {row[1] for row in db.execute("PRAGMA table_info(sops)")}
        assert db.execute("SELECT name FROM sqlite_master WHERE name='machines'").fetchone()
    migrate_down(path)
    with sqlite3.connect(path) as db:
        assert db.execute("SELECT version FROM schema_version").fetchone()[0] == 0
        assert not db.execute("SELECT name FROM sqlite_master WHERE name='sops'").fetchone()


def test_migration_imports_legacy_steps_and_renumbers_duplicates(tmp_path):
    path = tmp_path / "legacy.db"
    migrate_up(path)
    with sqlite3.connect(path) as db:
        db.execute("INSERT INTO sops(code,title) VALUES('LEG-1','SOP legado')")
        sop_id = db.execute("SELECT id FROM sops WHERE code='LEG-1'").fetchone()[0]
        db.execute("""CREATE TABLE sop_steps(
            id INTEGER PRIMARY KEY, sop_id INTEGER, step_number INTEGER, description TEXT,
            procedure_text TEXT, image_path TEXT, risk_codes TEXT, control_codes TEXT
        )""")
        db.executemany(
            "INSERT INTO sop_steps VALUES(?,?,?,?,?,?,?,?)",
            [(10, sop_id, 1, "Primero", "A", "", "1,2", "1"),
             (11, sop_id, 1, "Segundo", "B", "", "3", "2,3")],
        )
    migrate_up(path)
    migrate_up(path)
    with sqlite3.connect(path) as db:
        rows = db.execute(
            "SELECT step_number,risk_codes,control_codes FROM steps WHERE sop_id=? ORDER BY step_number", (sop_id,)
        ).fetchall()
        assert rows == [(1, '[\"1\", \"2\"]', '[\"1\"]'), (2, '[\"3\"]', '[\"2\", \"3\"]')]
