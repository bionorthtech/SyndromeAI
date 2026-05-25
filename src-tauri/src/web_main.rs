use clap::Parser;

mod checkpoint;
mod claude_binary;
mod commands;
mod process;
mod web_server;

#[derive(Parser)]
#[command(name = "syndrome-ai-web")]
#[command(about = "Syndrome AI Web Server - Access Syndrome AI from your browser")]
struct Args {
    /// Port to run the web server on
    #[arg(short, long, default_value = "8080")]
    port: u16,

    /// Host to bind to (127.0.0.1 for localhost only)
    #[arg(short = 'H', long, default_value = "127.0.0.1")]
    host: String,
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let args = Args::parse();

    println!("🚀 Starting Syndrome AI Web Server...");
    println!(
        "🌐 Listening at: http://{}:{}",
        args.host, args.port
    );

    if let Err(e) = web_server::start_web_mode(Some(args.port)).await {
        eprintln!("❌ Failed to start web server: {}", e);
        std::process::exit(1);
    }
}
