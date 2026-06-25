def test_cratedig_importable():
    """The engine must be installed and importable (DESIGN.md §3)."""
    import cratedig

    assert cratedig.__version__
