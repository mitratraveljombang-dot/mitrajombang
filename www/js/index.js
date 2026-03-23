document.addEventListener("deviceready", onDeviceReady, false);

function resolveServerUrl() {
  var lanHttpsUrl = "https://192.168.1.254:9999/server.php";
  var isSecurePage = window.location.protocol === "https:";
  var isLocalhostPage =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  var isCordovaApp =
    window.location.protocol === "file:" ||
    (window.cordova && cordova.platformId !== "browser");

  if (isCordovaApp) {
    return lanHttpsUrl;
  }

  if (isLocalhostPage) {
    return "https://localhost:9999/server.php";
  }

  return lanHttpsUrl;
}

function validateServerUrl(serverUrl) {
  var isSecurePage = window.location.protocol === "https:";
  var isInsecureServer = serverUrl.indexOf("http://") === 0;

  if (isSecurePage && isInsecureServer) {
    throw new Error(
      "Halaman HTTPS tidak boleh mengakses endpoint HTTP. Pakai server HTTPS atau jalankan app dari HTTP/file:// saat develop.",
    );
  }

  return serverUrl;
}

function onDeviceReady() {
  // Cordova is now initialized. Have fun!
  var device_id = "MITRAAPP13";
  var serverUrl;

  try {
    serverUrl = validateServerUrl(resolveServerUrl());
  } catch (error) {
    console.error("Konfigurasi server tidak valid:", error);
    alert(error.message);
    return;
  }

  console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
  document.getElementById("deviceready").classList.add("ready");

  // Sembunyikan Splash Screen setelah aplikasi siap
  if (navigator.splashscreen) {
    navigator.splashscreen.hide();
  }

  // 1. Meminta izin (Penting untuk iOS dan Android 13+)
  window.FirebasePlugin.grantPermission(function (hasPermission) {
    console.log("Izin notifikasi diberikan: " + hasPermission);
  });

  // 2. Mendapatkan Token FCM perangkat
  window.FirebasePlugin.getToken(
    function (token) {
      console.log("FCM token berhasil didapat:", token);

      fetch(serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: device_id,
          token: token,
        }),
      })
        .then(async (res) => {
          const text = await res.text();
          let data;

          try {
            data = JSON.parse(text);
          } catch (error) {
            throw new Error("Response server bukan JSON valid: " + text);
          }

          if (!res.ok) {
            throw new Error(data.msg || "HTTP error " + res.status);
          }

          return data;
        })
        .then((res) => {
          console.log("Token berhasil dikirim ke server:", res);
          alert(res.msg);
        })
        .catch((error) => {
          console.error("Gagal kirim token ke server:", error);
          alert("Gagal kirim token ke server: " + error.message);
        });
    },
    function (error) {
      console.error("Gagal mendapatkan token FCM:", error);
      alert("Gagal mendapatkan token FCM: " + error);
    },
  );

  // 3. Mengatur Default Channel dengan suara kustom
  window.FirebasePlugin.setDefaultChannel(
    {
      id: "fcm_default_channel",
      name: "Default",
      sound: "notif", // Nama file suara tanpa ekstensi
      importance: 5, // 4 = High importance (muncul pop-up)
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
        console.log("Pengguna mengklik notifikasi background. Rute: " + message.rute_tujuan);
      } else {
        // Notifikasi diterima saat aplikasi sedang terbuka (foreground)
        cordova.plugins.notification.local.schedule({
          title: message.title,
          text: message.body,
          foreground: true,
          channel: "fcm_default_channel", // Samakan channel ID dengan background agar suara & prioritas sama
          priority: 2, // Prioritas tinggi
          smallIcon: "res://ic_notification", // Menggunakan logo.png yang dicopy ke ic_notification
          sound: "res://notif", // Menggunakan notif.mp3
        });
      }
    },
    function (error) {
      console.error("Gagal menerima pesan: " + error);
    },
  );
}
