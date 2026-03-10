// System module — additional platform-specific utilities
// Most system integration is now in commands/ using native Rust crates
// This module provides helpers that don't fit neatly into commands

pub mod xdg_dirs;

#[cfg(target_os = "linux")]
pub mod ewmh;
