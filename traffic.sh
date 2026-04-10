for i in $(seq 1 50); do
  curl -s http://localhost:5001/health > /dev/null

  curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lawfirm.com","password":"Admin@123"}' > /dev/null

  curl -s http://localhost:5001/api/nonexistent > /dev/null

  echo "Request $i"
done