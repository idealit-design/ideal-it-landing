<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function textLength(string $value): int
{
    $length = preg_match_all('/./us', $value);
    if ($length === false) {
        respond(422, ['error' => 'Los campos de texto deben estar codificados en UTF-8.']);
    }

    return $length;
}

function requiredText(array $data, string $key, int $maxLength): string
{
    $value = $data[$key] ?? null;
    if (!is_string($value)) {
        respond(422, ['error' => "El campo {$key} es obligatorio y debe ser texto."]);
    }

    $value = trim($value);
    if ($value === '' || textLength($value) > $maxLength) {
        respond(422, ['error' => "El campo {$key} debe tener entre 1 y {$maxLength} caracteres."]);
    }

    return $value;
}

function requestData(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($data)) {
        respond(400, ['error' => 'El cuerpo debe contener un objeto JSON válido.']);
    }

    return $data;
}

$databaseDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0770, true) && !is_dir($databaseDirectory)) {
    error_log('MVP Visitor Pass: unable to create database directory.');
    respond(500, ['error' => 'No se pudo preparar el almacenamiento local.']);
}

try {
    $pdo = new PDO('sqlite:' . $databaseDirectory . DIRECTORY_SEPARATOR . 'visitors_mvp.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS visitantes (
            dni TEXT PRIMARY KEY,
            nombre_apellido TEXT NOT NULL,
            empresa_origen TEXT NOT NULL,
            telefono TEXT NOT NULL,
            fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS pases_temporales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_pase TEXT NOT NULL UNIQUE,
            dni_visitante TEXT NOT NULL,
            motivo_visita TEXT NOT NULL,
            persona_a_visitar TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'FINALIZADO')),
            hora_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            hora_salida DATETIME NULL,
            FOREIGN KEY (dni_visitante) REFERENCES visitantes(dni)
        )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_pases_estado ON pases_temporales (estado)');

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? '';

    if ($method === 'GET' && $action === 'visitor') {
        $dni = trim((string) ($_GET['dni'] ?? ''));
        if ($dni === '' || textLength($dni) > 32) {
            respond(422, ['error' => 'Indique un DNI válido (hasta 32 caracteres).']);
        }

        $statement = $pdo->prepare(
            'SELECT dni, nombre_apellido, empresa_origen, telefono, fecha_registro
             FROM visitantes WHERE dni = :dni'
        );
        $statement->execute(['dni' => $dni]);
        $visitor = $statement->fetch();
        if ($visitor === false) {
            respond(404, ['error' => 'No hay un visitante registrado con ese DNI.']);
        }

        respond(200, ['visitor' => $visitor]);
    }

    if ($method === 'GET' && $action === 'active') {
        $statement = $pdo->query(
            "SELECT p.id, p.codigo_pase, p.dni_visitante, p.motivo_visita,
                    p.persona_a_visitar, p.hora_ingreso, v.nombre_apellido,
                    v.empresa_origen
             FROM pases_temporales p
             JOIN visitantes v ON v.dni = p.dni_visitante
             WHERE p.estado = 'ACTIVO'
             ORDER BY p.hora_ingreso DESC, p.id DESC"
        );
        respond(200, ['visitors' => $statement->fetchAll()]);
    }

    if ($method === 'POST' && $action === 'visitor') {
        $data = requestData();
        $dni = requiredText($data, 'dni', 32);
        $name = requiredText($data, 'nombre_apellido', 120);
        $company = requiredText($data, 'empresa_origen', 120);
        $phone = requiredText($data, 'telefono', 40);

        $exists = $pdo->prepare('SELECT 1 FROM visitantes WHERE dni = :dni');
        $exists->execute(['dni' => $dni]);
        if ($exists->fetchColumn() !== false) {
            respond(409, ['error' => 'Ya existe un visitante registrado con ese DNI.']);
        }

        $statement = $pdo->prepare(
            'INSERT INTO visitantes (dni, nombre_apellido, empresa_origen, telefono)
             VALUES (:dni, :name, :company, :phone)'
        );
        $statement->execute([
            'dni' => $dni,
            'name' => $name,
            'company' => $company,
            'phone' => $phone,
        ]);
        respond(201, ['visitor' => [
            'dni' => $dni,
            'nombre_apellido' => $name,
            'empresa_origen' => $company,
            'telefono' => $phone,
        ]]);
    }

    if ($method === 'POST' && $action === 'pass') {
        $data = requestData();
        $dni = requiredText($data, 'dni', 32);
        $reason = requiredText($data, 'motivo_visita', 240);
        $host = requiredText($data, 'persona_a_visitar', 120);

        $visitorExists = $pdo->prepare('SELECT 1 FROM visitantes WHERE dni = :dni');
        $visitorExists->execute(['dni' => $dni]);
        if ($visitorExists->fetchColumn() === false) {
            respond(404, ['error' => 'Registre al visitante antes de emitir un pase.']);
        }

        $code = 'VP-' . strtoupper(bin2hex(random_bytes(5)));
        $statement = $pdo->prepare(
            'INSERT INTO pases_temporales
                (codigo_pase, dni_visitante, motivo_visita, persona_a_visitar)
             VALUES (:code, :dni, :reason, :host)'
        );
        $statement->execute([
            'code' => $code,
            'dni' => $dni,
            'reason' => $reason,
            'host' => $host,
        ]);
        respond(201, [
            'pass' => [
                'id' => (int) $pdo->lastInsertId(),
                'codigo_pase' => $code,
                'dni_visitante' => $dni,
                'motivo_visita' => $reason,
                'persona_a_visitar' => $host,
                'estado' => 'ACTIVO',
                'hora_ingreso' => gmdate('Y-m-d H:i:s'),
            ],
        ]);
    }

    if ($method === 'POST' && $action === 'exit') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id === null || $id < 1) {
            respond(422, ['error' => 'Indique un identificador de pase válido.']);
        }

        $statement = $pdo->prepare(
            "UPDATE pases_temporales
             SET estado = 'FINALIZADO', hora_salida = CURRENT_TIMESTAMP
             WHERE id = :id AND estado = 'ACTIVO'"
        );
        $statement->execute(['id' => $id]);
        if ($statement->rowCount() === 0) {
            respond(404, ['error' => 'El pase no existe o ya fue finalizado.']);
        }

        respond(200, ['status' => 'FINALIZADO', 'id' => $id]);
    }

    if (!in_array($method, ['GET', 'POST'], true)) {
        header('Allow: GET, POST');
        respond(405, ['error' => 'Método no permitido.']);
    }

    respond(404, ['error' => 'Acción no encontrada.']);
} catch (PDOException $exception) {
    error_log('MVP Visitor Pass database error: ' . $exception->getMessage());
    respond(500, ['error' => 'No se pudo completar la operación de almacenamiento.']);
}
