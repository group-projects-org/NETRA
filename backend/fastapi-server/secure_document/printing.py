"""Optional CUPS printing adapter.

CUPS may spool document data to disk. This adapter is not a diskless-print
guarantee; deployment operators must configure and audit the spool pipeline.
"""

from __future__ import annotations

from typing import Protocol


class PrintBackend(Protocol):
    def print_pdf(self, pdf_data: bytes, printer_name: str, job_title: str) -> int:
        """Submit PDF data and return a backend job identifier."""


class CupsPrintBackend:
    """Submit PDF bytes to a CUPS queue using PyCUPS.

    Install the optional dependency with: pip install -e '.[print]'
    """

    def print_pdf(self, pdf_data: bytes, printer_name: str, job_title: str) -> int:
        try:
            import cups
        except ImportError as exc:
            raise RuntimeError(
                "PyCUPS is required; install the optional 'print' dependency"
            ) from exc

        connection = cups.Connection()
        job_id = connection.createJob(printer_name, job_title, {})
        connection.startDocument(
            printer_name,
            job_id,
            "exam.pdf",
            "application/pdf",
            1,
        )
        try:
            connection.writeRequestData(pdf_data, len(pdf_data))
            connection.finishDocument(printer_name)
        except Exception:
            try:
                connection.cancelJob(job_id, purge_job=True)
            finally:
                raise
        return job_id
