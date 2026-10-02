import os

base_dir = "src"
directories = [
    "data",
    "hooks",
    "utils",
    "components/layout",
    "components/common",
    "components/tasks",
    "components/teacher",
    "components/student",
    "styles"
]

for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

print("Scaffolded directories.")
