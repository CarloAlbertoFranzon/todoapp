let express = require('express')
let sanitizeHTML = require('sanitize-html')
const mongodb = require("mongodb").MongoClient
const ObjectId  = require('mongodb').ObjectId




let app = express()
//creiamo la variabile db
let db

app.use(express.static('public'))

//una volta installato con npm ed agganciato il pacchetto mongoDB al nostro server.js per creare un collegamento al database usiamo la seguente funzione
let connectionString = 'mongodb+srv://todoAppUser:momsdaì12emmd@cluster0.u5ojj.mongodb.net/TodoApp?retryWrites=true&w=majority'
mongodb.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
  // nella seguente riga aggiungiamo a db (la variabile che abbiamo dichiarato prima e che ci serve per tutte le funzioni del CRUD) tutti i metodi di client.db()
  // ovviamente la variabile db che useremo spesso per tutto quello che ci serve, non viene popolata fino a quando non c'è una connessione al database ( mongodb.connect( etc etc) quindi se non c'è 
  db = client.db()
  // inseriamo app.listener(3000) all'interno della funzione che si connette al db per fare in modo che l'app funzioni e ci mostri la pagina solo dopo che si è connessa al db
  app.listen(3000)
})

app.use(express.json())
app.use(express.urlencoded({extended: false}))




// proteggiamo il sito con username e password
function passwordProtected(req, res, next){
  res.set('WWW-authenticate', 'Basic realm="Simple Todo App"')
  console.log(req.headers.authorization)

  //questo if ci serve per controllare se l'autenticazione è corretta.
  if(req.headers.authorization == "Basic bGVhcm46amF2YXNjcmlwdA=="){
    // in express possiamo passare più funzioni al metodo get e le svolge in ordine. next() ci permette di passare alla funzione successiva
    next()
  }else {
    res.status(401).send("Authentication required")  
  }
}
// use è una funzione di express che permette di applicare una funzione a tutte le chiamate get e post. In questo caso è la soluzione più veloce per passare la nostra funzione per il prompt della password.
app.use(passwordProtected)

app.get('/', function(req, res){
    // la riga seguente ci permette di connetterci al database, identificare la collection che ci interessa e trovare usando find() l'oggetto che ci interessa e metterlo in un array
    db.collection('items').find().toArray(function(err, items){
    // inserendo res.send all'interno della funzione che si connette al db possiamo usare l'array items che abbiamo appena creato ed inserire gli items che escono dal db all'interno della pagina
    res.send(`
    <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simple To-Do App</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
        </head>
        <body>
          <div class="container">
            <h1 class="display-4 text-center py-1">To-Do App</h1>
            
            <div class="jumbotron p-3 shadow-sm">
              <form id="create-form" action="/create-item" method="POST">
                <div class="d-flex align-items-center">
                  <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
                  <button class="btn btn-primary">Add New Item</button>
                </div>
              </form>
            </div>
            
            <ul id="item-list" class="list-group pb-5">
              
            </ul>
            
          </div>

        <script>
        let items = ${JSON.stringify(items)}
        </script>
        <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
        <script src="/browser.js"></script>  
        </body>
      </html>    
    `)
      
  })
    
    
})

//questo script risponde alle chiamate in entrata del server
app.post('/create-item',  function(req, res){
    // db.collection è un metodo dell'oggetto db (che dobbiamo creare prima, connettendo il server al database) che crea un colelgamento con la collection col nome tra parentesi ('items') in questo caso
    // insertOne() è un metodo che crea un oggetto all'interno della collection indicata e prende come secondo valore la risposta che da all'utente in uscita.
    
    let safeText = sanitizeHTML(req.body.text, {allowedTags: [], allowedAttributes: {}})
    db.collection('items').insertOne({text: safeText}, function(err, info) {

      if(err){
        console.log("Error occurred whilte inserting")
      } else{
        let data = {
          "_id": info.insertedId,
          "text": safeText
        }
      res.json(data)
      }
    })  
})

app.post('/update-item', function(req, res){
  // findOneAndUpdate è il metodo che ci permette di aggiornare il database il primo argomento ci permette di selezionare il campo da aggiornare, il secondo con cosa dobbiamo aggiornarlo, il terzo una funzione che dice al server cosa succede quando viene aggiornato
  let safeText = sanitizeHTML(req.body.text, {allowedTags: [], allowedAttributes: {}})
  // controlla perchè questo non viene ripulito quando viene aggiornato
  db.collection('items').findOneAndUpdate({_id: new ObjectId(req.body.id)}, {$set: {text: safeText}}, function() {
    res.send("Success")
  })
})

app.post('/delete-item', function(req, res){
  // in questo caso usiamo deleteOne per rimuovere l'elemento dal database
  db.collection('items').deleteOne({_id: new ObjectId(req.body.id)}, function(){
    res.send("Success")
  })
})


