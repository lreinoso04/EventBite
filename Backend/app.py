from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flasgger import Swagger
import os

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'eventbite.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
swagger = Swagger(app)

# --- MODELOS ---

class Evento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), default="Mi Evento Especial")
    # NUEVO: Campo para la fecha
    fecha = db.Column(db.String(20), default="") 

class Meta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    objetivo = db.Column(db.Integer, nullable=False)
    categoria = db.Column(db.String(50), default="General")

class Aporte(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meta_id = db.Column(db.Integer, db.ForeignKey('meta.id'), nullable=False)
    encargado = db.Column(db.String(100), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()
    if not Evento.query.first():
        db.session.add(Evento(nombre="Nombre del Evento"))
        db.session.commit()

# --- RUTAS DE CONTROL ---

@app.route('/config', methods=['GET', 'PUT'])
def manage_config():
    evt = Evento.query.first()
    
    if request.method == 'PUT':
        data = request.json
        # Actualizamos nombre y fecha si vienen en los datos
        evt.nombre = data.get('nombre', evt.nombre)
        evt.fecha = data.get('fecha', evt.fecha)
        db.session.commit()
        
    return jsonify({
        "nombre": evt.nombre, 
        "fecha": evt.fecha
    })

@app.route('/reset', methods=['DELETE'])
def reset_all():
    try:
        db.session.query(Aporte).delete()
        db.session.query(Meta).delete()
        evt = Evento.query.first()
        evt.nombre = "Nuevo Evento"
        evt.fecha = "" # Resetear fecha
        db.session.commit()
        return jsonify({"msg": "Todo reiniciado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- RUTAS CRUD (Sin cambios respecto a la versión anterior) ---

@app.route('/metas', methods=['GET', 'POST'])
def manage_metas():
    if request.method == 'GET':
        return jsonify([{
            "id": m.id, "nombre": m.nombre, "objetivo": m.objetivo, "categoria": m.categoria
        } for m in Meta.query.all()])
    
    data = request.json
    if not data.get('nombre') or not data.get('objetivo'):
        return jsonify({"error": "Faltan datos"}), 400
    try:
        objetivo_val = int(data['objetivo'])
    except ValueError:
        return jsonify({"error": "El objetivo debe ser un número"}), 400

    if objetivo_val <= 0:
        return jsonify({"error": "El valor debe ser positivo"}), 400
    if objetivo_val > 1000:
         return jsonify({"error": "El objetivo es demasiado alto (máx 1000)"}), 400

    categoria_recibida = data.get('categoria', 'General')
    nueva = Meta(nombre=data['nombre'], objetivo=objetivo_val, categoria=categoria_recibida)
    db.session.add(nueva)
    db.session.commit()
    return jsonify({"id": nueva.id}), 201

@app.route('/metas/<int:id>', methods=['DELETE'])
def delete_meta(id):
    meta = Meta.query.get_or_404(id)
    Aporte.query.filter_by(meta_id=id).delete()
    db.session.delete(meta)
    db.session.commit()
    return jsonify({"msg": "Deleted"})

@app.route('/aportes', methods=['GET', 'POST'])
def manage_aportes():
    if request.method == 'GET':
        return jsonify([{
            "id": a.id, "meta_id": a.meta_id, "encargado": a.encargado, "cantidad": a.cantidad, "estado": a.estado
        } for a in Aporte.query.all()])
    data = request.json
    if int(data['cantidad']) <= 0:
        return jsonify({"error": "La cantidad debe ser positiva"}), 400
    nuevo = Aporte(meta_id=data['meta_id'], encargado=data['encargado'], cantidad=int(data['cantidad']))
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"id": nuevo.id}), 201

@app.route('/aportes/<int:id>', methods=['PUT', 'DELETE'])
def modify_aporte(id):
    aporte = Aporte.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(aporte)
        db.session.commit()
        return jsonify({"msg": "Deleted"})
    data = request.json
    if 'estado' in data: aporte.estado = data['estado']
    if 'cantidad' in data: 
        if int(data['cantidad']) <= 0:
             return jsonify({"error": "La cantidad debe ser positiva"}), 400
        aporte.cantidad = int(data['cantidad'])
    if 'encargado' in data: aporte.encargado = data['encargado']
    db.session.commit()
    return jsonify({"msg": "Updated"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)