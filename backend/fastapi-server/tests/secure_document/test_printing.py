from secure_document.printing import PrintBackend


def test_print_backend_protocol_is_defined():
    # Structural smoke test: concrete printer integration is deployment-specific.
    assert hasattr(PrintBackend, "print_pdf")
