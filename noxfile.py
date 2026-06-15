import nox


@nox.session
def docs(session):
    """Build the documentation site."""
    with session.chdir("docs"):
        session.run("npx", "-y", "mystmd", "build", "--html", external=True)


@nox.session(name="docs-live")
def docs_live(session):
    """Start a live-reloading development server."""
    with session.chdir("docs"):
        session.run("npx", "-y", "mystmd", "start", external=True)


@nox.session
def test(session):
    """Run the tiny self-check (no dependencies)."""
    session.run("node", "test/aggregate.test.mjs", external=True)
