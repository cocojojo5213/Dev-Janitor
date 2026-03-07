use std::io::{self, Read};
use std::process::{Child, Command, Output, Stdio};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

pub fn command_no_window(program: &str) -> Command {
    #[allow(unused_mut)]
    let mut command = Command::new(program);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    command
}

pub fn command_output_with_timeout(
    program: &str,
    args: &[&str],
    timeout: Duration,
) -> io::Result<Output> {
    let owned_args: Vec<String> = args.iter().map(|arg| (*arg).to_string()).collect();
    command_output_with_timeout_vec(program, &owned_args, timeout)
}

pub fn command_output_with_timeout_vec(
    program: &str,
    args: &[String],
    timeout: Duration,
) -> io::Result<Output> {
    let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
    let mut child = spawn_command(program, &arg_refs)?;
    let stdout_handle = child.stdout.take().map(spawn_reader);
    let stderr_handle = child.stderr.take().map(spawn_reader);

    let start = Instant::now();
    let status = loop {
        if let Some(status) = child.try_wait()? {
            break status;
        }

        if start.elapsed() >= timeout {
            let _ = child.kill();
            let _ = child.wait();
            let _ = join_reader(stdout_handle);
            let _ = join_reader(stderr_handle);
            return Err(io::Error::new(
                io::ErrorKind::TimedOut,
                format!(
                    "Command timed out after {:?}: {} {}",
                    timeout,
                    program,
                    args.join(" ")
                ),
            ));
        }

        std::thread::sleep(Duration::from_millis(50));
    };

    let stdout = join_reader(stdout_handle);
    let stderr = join_reader(stderr_handle);

    Ok(Output {
        status,
        stdout,
        stderr,
    })
}

fn spawn_reader<R>(mut reader: R) -> JoinHandle<Vec<u8>>
where
    R: Read + Send + 'static,
{
    thread::spawn(move || {
        let mut buffer = Vec::new();
        let _ = reader.read_to_end(&mut buffer);
        buffer
    })
}

fn join_reader(handle: Option<JoinHandle<Vec<u8>>>) -> Vec<u8> {
    handle
        .and_then(|reader| reader.join().ok())
        .unwrap_or_default()
}

fn spawn_command(program: &str, args: &[&str]) -> io::Result<Child> {
    #[cfg(target_os = "windows")]
    {
        if should_use_cmd_wrapper(program) {
            return command_no_window("cmd")
                .args(["/D", "/S", "/C"])
                .arg(format_cmd_command_line(program, args))
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();
        }
    }

    command_no_window(program)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
}

#[cfg(target_os = "windows")]
fn should_use_cmd_wrapper(program: &str) -> bool {
    use std::path::Path;

    let extension = Path::new(program)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase());

    if matches!(extension.as_deref(), Some("cmd" | "bat")) {
        return true;
    }

    which::which(program)
        .ok()
        .and_then(|path| {
            path.extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext.eq_ignore_ascii_case("cmd") || ext.eq_ignore_ascii_case("bat"))
        })
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn format_cmd_command_line(program: &str, args: &[&str]) -> String {
    let resolved_program = which::which(program)
        .ok()
        .map(|path| path.to_string_lossy().into_owned())
        .unwrap_or_else(|| program.to_string());

    std::iter::once(quote_cmd_arg(&resolved_program))
        .chain(args.iter().map(|arg| quote_cmd_arg(arg)))
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(target_os = "windows")]
fn quote_cmd_arg(arg: &str) -> String {
    if arg.is_empty() {
        return "\"\"".to_string();
    }

    let escaped = arg.replace('"', "\"\"");
    let needs_quotes = escaped
        .chars()
        .any(|ch| ch.is_whitespace() || matches!(ch, '&' | '|' | '<' | '>' | '(' | ')' | '^'));

    if needs_quotes || escaped != arg {
        format!("\"{}\"", escaped)
    } else {
        escaped
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(target_os = "windows")]
    use std::fs;
    #[cfg(target_os = "windows")]
    use std::path::PathBuf;
    #[cfg(target_os = "windows")]
    use std::process;
    #[cfg(target_os = "windows")]
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn captures_large_stdout_without_blocking() {
        let output = command_output_with_timeout(
            "sh",
            &[
                "-c",
                "i=0; while [ $i -lt 5000 ]; do echo output-line; i=$((i+1)); done",
            ],
            Duration::from_secs(5),
        )
        .expect("command should succeed");

        assert!(output.status.success());
        assert!(String::from_utf8_lossy(&output.stdout).lines().count() >= 5000);
    }

    #[test]
    fn times_out_long_running_command() {
        #[cfg(target_os = "windows")]
        let result = command_output_with_timeout(
            "powershell",
            &["-NoProfile", "-Command", "Start-Sleep -Seconds 2"],
            Duration::from_millis(100),
        );

        #[cfg(not(target_os = "windows"))]
        let result = command_output_with_timeout(
            "sh",
            &["-c", "sleep 2"],
            Duration::from_millis(100),
        );

        assert!(result.is_err());
        assert_eq!(
            result.expect_err("command should time out").kind(),
            io::ErrorKind::TimedOut
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn quotes_windows_cmd_command_line() {
        let formatted = format_cmd_command_line(
            r"C:\Program Files\nodejs\npm.cmd",
            &["install", "-g", "@openai/codex"],
        );

        assert_eq!(
            formatted,
            r#""C:\Program Files\nodejs\npm.cmd" install -g @openai/codex"#
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn wraps_batch_scripts_and_preserves_special_characters() {
        let script_path = create_temp_batch_script(
            "echo-args.cmd",
            "@echo off\r\nsetlocal\r\nset \"arg1=%~1\"\r\nset \"arg2=%~2\"\r\nif not \"%arg1%\"==\"hello world\" exit /b 1\r\nif not \"%arg2%\"==\"name&value\" exit /b 1\r\necho OK\r\n",
        );

        let args = vec!["hello world".to_string(), "name&value".to_string()];
        let output = command_output_with_timeout_vec(
            script_path.to_string_lossy().as_ref(),
            &args,
            Duration::from_secs(5),
        )
        .expect("batch script should execute");

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(output.status.success(), "stdout: {stdout}\nstderr: {stderr}");
        assert!(stdout.contains("OK"));

        let _ = fs::remove_file(&script_path);
        let _ = script_path.parent().map(fs::remove_dir_all);
    }

    #[cfg(target_os = "windows")]
    fn create_temp_batch_script(file_name: &str, contents: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after epoch")
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "dev janitor command tests {} {}",
            process::id(),
            unique
        ));
        fs::create_dir_all(&dir).expect("temp directory should be created");

        let script_path = dir.join(file_name);
        fs::write(&script_path, contents).expect("batch script should be written");
        script_path
    }
}
