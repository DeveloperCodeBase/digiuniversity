param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("push","pull","build","up","down","restart","logs","logs-live","test","status","shell")]
    [string]$Action
)

$Server = "my-vps"
$ProjectPath = "/var/www/digiuniversity"
$Branch = "main"

function Remote($cmd) {
    ssh $Server "cd $ProjectPath && $cmd"
}

switch ($Action) {
    "push" {
        git add .
        git commit -m "agent update"
        git push origin $Branch
    }

    "pull" {
        Remote "git pull origin $Branch"
    }

    "build" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose build"
    }

    "up" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose up -d --build"
    }

    "down" {
        Remote "docker compose down"
    }

    "restart" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose down && docker compose up -d --build"
    }

    "logs" {
        Remote "docker compose logs --tail=200"
    }

    "logs-live" {
        ssh $Server "cd $ProjectPath && docker compose logs -f --tail=100"
    }

    "test" {
        git push origin $Branch
        Remote "git pull origin $Branch && docker compose run --rm app npm test"
    }

    "status" {
        Remote "git status && docker compose ps && docker ps"
    }

    "shell" {
        ssh $Server
    }
}