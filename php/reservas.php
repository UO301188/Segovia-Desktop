<?php
// reservas.php - Paradigma Orientado a Objetos puro
session_start();

class CentralReservas {
    private $host = "localhost";
    private $user = "DBUSER2026"; 
    private $pass = "DBPWD2026";  
    private $dbname = "turismo_segovia";
    private $db;

    public function __construct() {
        $this->conectar();
    }

    private function conectar() {
        $this->db = new mysqli($this->host, $this->user, $this->pass, $this->dbname);
        if ($this->db->connect_error) {
            die("Error de conexión. Asegúrate de haber importado archivo.sql: " . $this->db->connect_error);
        }
        $this->db->set_charset("utf8");
    }

    public function registrarUsuario($nombre, $apellidos, $email, $password) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare("INSERT INTO Usuarios (nombre, apellidos, email, password) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $nombre, $apellidos, $email, $hash);
        if($stmt->execute()){
            return "Registro completado con éxito. Ya puedes iniciar sesión.";
        }
        return "Error: El email ya está registrado.";
    }

    public function iniciarSesion($email, $password) {
        $stmt = $this->db->prepare("SELECT id, nombre, password FROM Usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            if (password_verify($password, $row['password'])) {
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['user_nombre'] = $row['nombre'];
                return true;
            }
        }
        return false;
    }

    public function obtenerRecursos() {
        $query = "SELECT * FROM Recursos";
        return $this->db->query($query);
    }

    public function obtenerRecursoPorId($id) {
        $stmt = $this->db->prepare("SELECT * FROM Recursos WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function confirmarReserva($id_recurso, $personas) {
        $recurso = $this->obtenerRecursoPorId($id_recurso);
        if (!$recurso) return "Recurso no encontrado.";
        
        $subtotal = $recurso['precio'] * $personas;
        
        // Crear cabecera reserva
        $stmt = $this->db->prepare("INSERT INTO Reservas (id_usuario) VALUES (?)");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $id_reserva = $this->db->insert_id;
        
        // Crear detalle
        $stmt2 = $this->db->prepare("INSERT INTO LineasReserva (id_reserva, id_recurso, personas, subtotal) VALUES (?, ?, ?, ?)");
        $stmt2->bind_param("iiid", $id_reserva, $id_recurso, $personas, $subtotal);
        $stmt2->execute();
        
        return "Reserva confirmada. Presupuesto total: " . $subtotal . " €";
    }

    public function obtenerMisReservas() {
        $stmt = $this->db->prepare("
            SELECT r.id, rec.nombre, l.personas, l.subtotal, r.fecha_reserva, r.estado 
            FROM Reservas r 
            JOIN LineasReserva l ON r.id = l.id_reserva 
            JOIN Recursos rec ON l.id_recurso = rec.id 
            WHERE r.id_usuario = ? ORDER BY r.fecha_reserva DESC
        ");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        return $stmt->get_result();
    }

    public function anularReserva($id_reserva) {
        $stmt = $this->db->prepare("UPDATE Reservas SET estado = 'Anulada' WHERE id = ? AND id_usuario = ?");
        $stmt->bind_param("ii", $id_reserva, $_SESSION['user_id']);
        $stmt->execute();
    }
}

$app = new CentralReservas();
$mensaje = "";

// Manejador de peticiones
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['accion'])) {
        if ($_POST['accion'] == 'registro') {
            $mensaje = $app->registrarUsuario($_POST['nombre'], $_POST['apellidos'], $_POST['email'], $_POST['password']);
        } elseif ($_POST['accion'] == 'login') {
            if (!$app->iniciarSesion($_POST['email'], $_POST['password'])) {
                $mensaje = "Credenciales incorrectas.";
            }
        } elseif ($_POST['accion'] == 'reservar' && isset($_SESSION['user_id'])) {
            $mensaje = $app->confirmarReserva($_POST['id_recurso'], $_POST['personas']);
        } elseif ($_POST['accion'] == 'anular' && isset($_SESSION['user_id'])) {
            $app->anularReserva($_POST['id_reserva']);
            $mensaje = "Reserva anulada correctamente.";
        } elseif ($_POST['accion'] == 'logout') {
            session_destroy();
            header("Location: reservas.php");
            exit();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservas — Turismo en Segovia</title>
  <link rel="stylesheet" href="estilo/estilo.css">
  <link rel="stylesheet" href="estilo/layout.css">
</head>
<body>

  <header>
    <h1><a href="index.html">Turismo en Segovia</a></h1>
    <p>Descubre la magia de una ciudad Patrimonio de la Humanidad</p>
  </header>

  <nav aria-label="Navegación principal">
    <ul>
      <li><a href="index.html">Inicio</a></li>
      <li><a href="gastronomia.html">Gastronomía</a></li>
      <li><a href="rutas.html">Rutas</a></li>
      <li><a href="meteorologia.html">Meteorología</a></li>
      <li><a href="juego.html">Juego</a></li>
      <li><a href="reservas.php" class="activo" aria-current="page">Reservas</a></li>
      <li><a href="ayuda.html">Ayuda</a></li>
    </ul>
  </nav>

  <nav aria-label="breadcrumb">
    <ol>
      <li><a href="index.html">Inicio</a></li>
      <li aria-current="page">Reservas</li>
    </ol>
  </nav>

  <main data-pagina="reservas">
    <h2>Central de Reservas Turísticas</h2>
    
    <?php if(!empty($mensaje)): ?>
        <p role="alert" data-tipo="info">
            <?php echo htmlspecialchars($mensaje); ?>
        </p>
    <?php endif; ?>

    <?php if (!isset($_SESSION['user_id'])): ?>
        <article>
            <h3>Iniciar Sesión</h3>
            <form method="POST" action="reservas.php">
                <input type="hidden" name="accion" value="login">
                <label>Email: <input type="email" name="email" required></label>
                <label>Contraseña: <input type="password" name="password" required></label>
                <button type="submit">Entrar</button>
            </form>
        </article>

        <article>
            <h3>¿No tienes cuenta? Regístrate</h3>
            <form method="POST" action="reservas.php">
                <input type="hidden" name="accion" value="registro">
                <label>Nombre: <input type="text" name="nombre" required></label>
                <label>Apellidos: <input type="text" name="apellidos" required></label>
                <label>Email: <input type="email" name="email" required></label>
                <label>Contraseña: <input type="password" name="password" required></label>
                <button type="submit">Registrarse</button>
            </form>
        </article>
    
    <?php else: ?>
        <p>Bienvenido/a, <strong><?php echo htmlspecialchars($_SESSION['user_nombre']); ?></strong>. 
           <form method="POST" data-tipo="inline">
               <input type="hidden" name="accion" value="logout">
               <button type="submit" data-tamano="pequeno">Cerrar sesión</button>
           </form>
        </p>

        <h3>Recursos Disponibles para Reservar</h3>
        <div data-componente="recursos-grid">
            <?php 
            $recursos = $app->obtenerRecursos();
            if ($recursos && $recursos->num_rows > 0): 
                while ($res = $recursos->fetch_assoc()):
            ?>
                <article>
                    <h4><?php echo htmlspecialchars($res['nombre']); ?></h4>
                    <p><?php echo htmlspecialchars($res['descripcion']); ?></p>
                    <ul>
                        <li><strong>Plazas totales:</strong> <?php echo $res['plazas']; ?></li>
                        <li><strong>Inicio:</strong> <?php echo $res['fecha_inicio']; ?></li>
                        <li><strong>Precio por persona:</strong> <?php echo $res['precio']; ?> €</li>
                    </ul>
                    <form method="POST" action="reservas.php">
                        <input type="hidden" name="accion" value="reservar">
                        <input type="hidden" name="id_recurso" value="<?php echo $res['id']; ?>">
                        <label>Personas: <input type="number" name="personas" min="1" max="<?php echo $res['plazas']; ?>" value="1" data-tipo="cantidad" required></label>
                        <button type="submit">Calcular Presupuesto y Reservar</button>
                    </form>
                </article>
            <?php 
                endwhile;
            endif; 
            ?>
        </div>

        <h3>Mis Reservas</h3>
        <table>
            <thead>
                <tr>
                    <th>Recurso</th>
                    <th>Personas</th>
                    <th>Total Pagado</th>
                    <th>Estado</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $misReservas = $app->obtenerMisReservas();
                if ($misReservas && $misReservas->num_rows > 0):
                    while ($mres = $misReservas->fetch_assoc()):
                ?>
                <tr>
                    <td><?php echo htmlspecialchars($mres['nombre']); ?></td>
                    <td><?php echo htmlspecialchars($mres['personas']); ?></td>
                    <td><?php echo htmlspecialchars($mres['subtotal']); ?> €</td>
                    <td><strong><?php echo htmlspecialchars($mres['estado']); ?></strong></td>
                    <td>
                        <?php if($mres['estado'] == 'Confirmada'): ?>
                        <form method="POST" action="reservas.php">
                            <input type="hidden" name="accion" value="anular">
                            <input type="hidden" name="id_reserva" value="<?php echo $mres['id']; ?>">
                            <button type="submit" data-accion="peligro">Anular</button>
                        </form>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php 
                    endwhile;
                else: 
                ?>
                <tr><td colspan="5">No tienes reservas activas.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    <?php endif; ?>
  </main>

  <footer>
    <p>© 2026 Turismo en Segovia — Proyecto SEW 2025/26</p>
    <p>
      <a href="https://www.turismodesegovia.com" target="_blank" rel="noopener">turismodesegovia.com</a>
      &nbsp;|&nbsp;
      <a href="ayuda.html">Ayuda</a>
    </p>
  </footer>
</body>
</html>