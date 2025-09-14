#!/usr/bin/env python3
import http.server
import socketserver
import socket
import os
from functools import partial

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Different caching strategies for different file types
        if self.path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
            # Aggressive caching for images (1 week)
            self.send_header('Cache-Control', 'public, max-age=604800, immutable')
            self.send_header('Expires', 'Thu, 31 Dec 2024 23:59:59 GMT')
        elif self.path.endswith(('.mp4', '.webm', '.mov')):
            # Moderate caching for videos (1 day)
            self.send_header('Cache-Control', 'public, max-age=86400')
        elif self.path.endswith(('.css', '.js')):
            # Moderate caching for CSS/JS (1 hour)
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            # No cache for HTML files during development
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

class ReuseTCPServer(socketserver.TCPServer):
    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind(self.server_address)

if __name__ == "__main__":
    PORT = 5000
    HOST = "0.0.0.0"  # Allow all hosts for Replit proxy
    
    with ReuseTCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Server running at http://{HOST}:{PORT}/")
        print("Serving files from current directory")
        httpd.serve_forever()