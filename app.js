const express = require("express");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const stripe = require("stripe"); const { captureRejectionSymbol } = require("nodemailer/lib/xoauth2");
const { error } = require("console");
("sk_test_51LVHhtJqwXpikLDTcXdoFKWZdrGnhFUIaJuRKyNpcsZJLUmmt3if2wkzWI5xrjAeJ3VAyEw7Ja0VA9hWMEfPIKET00IjVxWO7G");
const db = new sqlite3.Database("./db/traintiquets.db");
const server = express();

server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static(__dirname + "/public"));
server.set("view engine", "ejs");
server.use(cookieParser());

const port = 3105;
const timeExp = 1000 * 60 * 60;




server.use(
  sessions({
    secret: "rfghf66a76ythggi87au7td",
    saveUninitialized: true,
    cookie: { maxAge: timeExp },
    resave: false,
  })
);




server.get("/", (req, res) => {
  res.render("principal");
});


server.get("/inicio", (req, res) => {
  res.render("iniciar");
});


server.get("/actualizarcli", (req, res) => {
  res.render("cuenta");
});




server.get("/infocliente", (req, res) => {
  sessions = req.session;
  email=req.session.correo;
  if (sessions.correo) {
    db.get(
      `SELECT * FROM registro WHERE correo =$correo`,
      {
        $correo: sessions.correo,
      },
      (error, rows) => {
        if (error) {
          return res.status(500).redirect("/informa");
        }

        return res.render("informa", { user: rows });
      }
    );
  }
});

server.post('/actuminfo',(req,res)=>{
email=req.session.correo;
let name=req.body.nombre;
let apellido=req.body.apellido;
 
console.log(email);
db.run("UPDATE registro SET nombres=?,apellidos=? WHERE correo=?",
[name,apellido,email],(error,row)=>{
if(!error){
  return res.redirect("/infocliente")
}
if(error){
  res.send("No se pudo actualizar")
  console.log(error);
}
}
)

});



server.post("/login", (req, res) => {
  let correo = req.body.correo;
  let contrase??a = req.body.contrase??a;
  db.get(
    "SELECT contrase??a FROM registro WHERE correo=$correo",
    {
      $correo: correo,
    },
    (error, rows) => {
      if (rows) {
        if (bcrypt.compareSync(contrase??a, rows.contrase??a)) {
          session = req.session;
          session.correo = correo;
          return res.render("iniciada");
        }
        return res.send("La contrase??a es incorrecta");
      }
      return res.send("El usuario no existe");
    }
  );
});



server.get("/registro", (req, res) => {
  res.render("registro");
});

server.post("/registro", [
  body('nombres', 'El tipo de datos es incorrecto, pudo haber ingresado algun caracter especial, algun numero o poder estado vacio.').exists().isLength({ min: 3 }),
  body('apellidos', 'El tipo de datos es incorrecto, pudo haber ingresado algun caracter especial, algun numero o poder estado vacio.').exists().isLength({ min: 3 }),
  body('correo', 'El correo ingresado es invalido, por favor retifiquelo').exists().isEmail(),
  body('contrase??a', 'La contrase??a debe tener como minimo 6 caracteres y un caracter especial').exists().isLength({ min: 6 })
], (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const valores = req.body;
    const validaciones = errors.array();
    return res.render('registro', { valores: valores, validaciones: validaciones, fechaActual: fechaActual });
  } else {
    let nombres = req.body.nombres;
    let apellidos = req.body.apellidos;
    let correo = req.body.correo;
    let contrase??a = req.body.contrase??a;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(contrase??a, salt);
    db.get(
      `INSERT INTO registro(nombres, apellidos, correo,  contrase??a) VALUES(?,?,?,?)`,
      [nombres, apellidos, correo, hash],
      function (error) {
        if (!error) {
          console.log("insert ok");
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            auth: {
              user: "11traintickets11@gmail.com",
              pass: "whvzzawcqsprwwgu",
            },
          });
          transporter
            .sendMail({
              from: "11tickettrain11@gmail.com",
              to: correo,
              subject: "Registro exitoso",
              html: "<h1>SU REGISTRO FUE EXITOSO</h1><p>Apreciado Usuario(a), el presente correo es para informar que ha sido registrado(a) correctamente en nuestro aplicativo web <b>Train Tiquets</b> Esperamos que nuestra aplicaci??n sea de su agrado y disfrute de todas las herramientas brindadas en esta web</p>",
            })
            .then((res) => {
              console.log(res);
            })
            .catch((err) => {
              console.log(err);
            });
          return res.render("principal");
        } else {
          if (error) {
            let errorPrimaria = ["El correo ya esta registrado, por favor intente con otro o recepere la contrase??a de este"];
            if (error.errno == 19) {
              res.render('registro', { errorPrimaria: errorPrimaria, error: error });
            }


          }
          return console.log("inset error", error);
        }
      }
    );
  }
});



server.get("/logOut", (req, res) => {
  session = req.session;
  if (session.correo) {
    req.session.destroy();
    return res.redirect("/");
  }
  return res.send("No tiene sesion para cerrar");
});



server.get("/recuperar", (req, res) => {
  res.render("validarCorreo");
});


server.post("/correoAutentificado", (req, res) => {
  let correo = req.body.correo;
  db.get(
    "SELECT nombres FROM registro WHERE correo=$correo",
    {
      $correo: correo,
    },
    (error, rows) => {
      let nombre = rows.nombres;
      if (!error) {
        res.render("recuperarContrase??a");
        let contrase??aDefinitiva = random();
        //? envia el correo de la nueva contrase??a
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          auth: {
            user: "11traintickets11@gmail.com",
            pass: "whvzzawcqsprwwgu",
          },
        });
        transporter
          .sendMail({
            from: "11tickettrain11@gmail.com",
            to: correo,
            subject: "Recuperar contrase??a",
            html:
              "hola " +
              nombre +
              " su nueva contrase??a es:" +
              contrase??aDefinitiva,
          })
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
          });
        //?se hashea la contrase??a nueva
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(contrase??aDefinitiva, salt);
        //? se actializa la contrase??a por la que ya se avia creado antes
        db.get(
          "UPDATE registro SET contrase??a = $contrase??a WHERE correo=$correo",
          {
            $contrase??a: hash,
            $correo: correo,
          },
          (error) => {
            if (!error) {
              return console.log("update OK");
            }
          }
        );
      }
    }
  );
});


server.post("/cambiar", (req, res) => {
  let correo = req.body.correo;
  let codigo = req.body.codigoContrase??a;
  let contrase??aNueva = req.body.contrase??aNueva;

  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(contrase??aNueva, salt);
  db.get(
    "SELECT contrase??a FROM registro WHERE correo=$correo",
    {
      $correo: correo,
    },
    (error, rows) => {
      if (!error) {
        if (bcrypt.compareSync(codigo, rows.contrase??a)) {
          db.get(
            "UPDATE registro SET contrase??a=$contrase??a WHERE correo=$correo",
            {
              $contrase??a: hash,
              $correo: correo,
            },
            (error) => {
              if (!error) {
                console.log("UPDATE OK");
                return res.render("principal");
              }
            }
          );
        }
      }
    }
  );
});



server.get("/comprar", (req, res) => {
  res.render("comprar")
})

server.get("/comprandoTiquete", (req, res) => {
  res.send("fechaActual");
})

server.listen(port, () => {
  console.log(`Su puerto es  ${port}`);
});

/*
-------------------------------------------------------------------------------
*/

function random() {
  let rangoContrase??a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let contrase??a = "";
  let controlador = 6;
  for (let i = 0; i < controlador; i++) {
    contrase??a += rangoContrase??a[Math.floor(Math.random() * 10)];
  }
  return contrase??a;
}

let keys = {
  public: "pk_test_51LVHhtJqwXpikLDT6RNHgqBeZXhvcdlDGDzP0yIINeObT7O53DGHFHgkSvXOMhPqaIq1lQr66fUcb9frmz1LRXyB00ViFE36IL",
  secret: "sk_test_51LVHhtJqwXpikLDTcXdoFKWZdrGnhFUIaJuRKyNpcsZJLUmmt3if2wkzWI5xrjAeJ3VAyEw7Ja0VA9hWMEfPIKET00IjVxWO7G"
}


const fecha = new Date();
const a??oActual = fecha.getFullYear();
const diaActual = fecha.getDate();
const mesActual = fecha.getMonth() + 1;
const fechaActual = a??oActual + "-" + mesActual + "-" + diaActual;