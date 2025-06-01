module.exports = {
  apps: [{
    name: 'iptv-backend',
    script: 'server.js',  // << Aquí es donde está el arranque real
    env: {
      PORT: 5000,
      DB_HOST: "127.0.0.1",
      DB_USER: "iptv_user",
      DB_PASSWORD: "S3cureP@ssw0rd",
      DB_NAME: "iptv_db",
      JWT_SECRET: "L8v3yB1zR4sQ7nU2mX9kP5dF0jT6wE8a"
    }
  }]
}
