document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  // Cordova is now initialized. Have fun!

  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  document.getElementById("deviceready").classList.add("ready");

  // 1. Meminta izin (Penting untuk iOS dan Android 13+)
  window.FirebasePlugin.grantPermission(function (hasPermission) {
    console.log("Izin notifikasi diberikan: " + hasPermission);
  });

  // 2. Mendapatkan Token FCM perangkat
  window.FirebasePlugin.getToken(
    function (token) {
      console.log("Token FCM Perangkat: " + token);
      // TODO: Kirim token ini ke server PHP/Database Anda
    },
    function (error) {
      console.error("Gagal mendapatkan token: " + error);
    },
  );

  // 3. Mengatur Default Channel dengan suara kustom
  window.FirebasePlugin.setDefaultChannel(
    {
      id: "fcm_default_channel",
      name: "Default",
      sound: "notif", // Nama file suara tanpa ekstensi
      importance: 4, // 4 = High importance (muncul pop-up)
      vibration: true,
    },
    function () {
      console.log("Default channel berhasil diatur");
    },
    function (error) {
      console.error("Gagal mengatur default channel: " + error);
    },
  );

  // 4. Menangani notifikasi yang masuk
  window.FirebasePlugin.onMessageReceived(
    function (message) {
      console.log("Pesan diterima: ", message);

      if (message.tap === "background") {
        // Notifikasi diklik dari background
        console.log(
          "Pengguna mengklik notifikasi dengan data rute: " +
            message.rute_tujuan,
        );
      } else {
        // Notifikasi diterima saat aplikasi sedang terbuka (foreground)
        alert("Pesan Baru: " + message.title + "\n" + message.body);
      }
    },
    function (error) {
      console.error("Gagal menerima pesan: " + error);
    },
  );
}

function ensureAndroidNotificationPermission(done) {
  if (!window.cordova || cordova.platformId !== "android") {
    done();
    return;
  }

  var permissions = cordova.plugins && cordova.plugins.permissions;
  if (!permissions || !permissions.POST_NOTIFICATIONS) {
    done();
    return;
  }

  permissions.checkPermission(
    permissions.POST_NOTIFICATIONS,
    function (status) {
      if (status.hasPermission) {
        done();
        return;
      }
      permissions.requestPermission(
        permissions.POST_NOTIFICATIONS,
        function () {
          done();
        },
        function (err) {
          console.warn("Gagal minta izin notifikasi:", err);
          done();
        },
      );
    },
    function (err) {
      console.warn("Gagal cek izin notifikasi:", err);
      done();
    },
  );
}
