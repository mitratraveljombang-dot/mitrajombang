<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ambil data JSON dari request
$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    echo json_encode([
        "status" => false,
        "msg" => "body JSON tidak valid"
    ]);
    exit;
}

// validasi
$device_id = $input['device_id'] ?? '';
$token     = $input['token'] ?? '';

if(!$device_id || !$token){
    echo json_encode([
        "status" => false,
        "msg" => "device_id atau token kosong"
    ]);
    exit;
}

// file penyimpanan
$file = "devices.json";

// baca data lama
$data = [];

if(file_exists($file)){
    $json = file_get_contents($file);
    $data = json_decode($json, true);
}

// pastikan array
if(!is_array($data)){
    $data = [];
}

$found = false;

// cek apakah device sudah ada
foreach($data as &$item){
    if($item['device_id'] === $device_id){
        // update token jika berubah
        $item['token'] = $token;
        $item['updated_at'] = date("Y-m-d H:i:s");
        $found = true;
        break;
    }
}

// kalau belum ada → tambah baru
if(!$found){
    $data[] = [
        "device_id" => $device_id,
        "token" => $token,
        "created_at" => date("Y-m-d H:i:s"),
        "updated_at" => date("Y-m-d H:i:s")
    ];
}

// simpan ke JSON
file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));

// response
echo json_encode([
    "status" => true,
    "msg" => $found ? "Token diupdate" : "Device baru disimpan"
]);
