set -o errexit  # exit on error

pip install -r backend1/requirements.txt

python backend1/manage.py collectstatic --no-input
python backend1/manage.py migrate
