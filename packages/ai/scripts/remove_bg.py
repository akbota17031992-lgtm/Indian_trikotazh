#!/usr/bin/env python3
"""
India Trikotaj AI Pipeline - Background Removal Bridge
Reads image buffer from stdin, applies rembg, writes PNG buffer to stdout.
Exits with code 10 if rembg is not installed (for fast fallback engagement).
"""
import sys

def main():
    try:
        from rembg import remove
    except ImportError:
        sys.stderr.write("rembg_not_installed\n")
        sys.exit(10)

    try:
        input_data = sys.stdin.buffer.read()
        if not input_data:
            sys.stderr.write("empty_stdin_buffer\n")
            sys.exit(11)

        output_data = remove(input_data)
        sys.stdout.buffer.write(output_data)
        sys.stdout.buffer.flush()
        sys.exit(0)
    except Exception as exc:
        sys.stderr.write(f"rembg_execution_error: {str(exc)}\n")
        sys.exit(12)

if __name__ == '__main__':
    main()
