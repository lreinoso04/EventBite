from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'eventbite.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- MODELOS DE LA BASE DE DATOS ---
class Evento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    fecha = db.Column(db.String(50), default="")
    admin_pass = db.Column(db.String(100), nullable=False) 

class Meta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    objetivo = db.Column(db.Integer, nullable=False)
    unidad = db.Column(db.String(50), default="Unidades") # Campo para Libras, Cajas, etc.
    categoria = db.Column(db.String(50), default="Comida")
    prioridad = db.Column(db.String(20), default="Normal")
    evento_id = db.Column(db.Integer, db.ForeignKey('evento.id'), nullable=False)

class Aporte(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meta_id = db.Column(db.Integer, db.ForeignKey('meta.id'), nullable=False)
    encargado = db.Column(db.String(100), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()

# --- RUTAS DE LA API ---

# 1. Obtener todos los eventos (Para el Dashboard)
@app.route('/eventos', methods=['GET'])
def get_all_events():
    eventos = Evento.query.all()
    return jsonify([{"id": e.id, "nombre": e.nombre, "fecha": e.fecha} for e in eventos])

# 2. Crear un nuevo evento
@app.route('/crear-evento', methods=['POST'])
def create_event():
    data = request.json
    if not data.get('nombre') or not data.get('password'):
        return jsonify({"error": "Faltan datos"}), 400
    nuevo = Evento(nombre=data['nombre'], admin_pass=data['password'], fecha="")
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"id": nuevo.id, "nombre": nuevo.nombre}), 201

# 3. Verificar contraseña de administrador
@app.route('/verificar-admin', methods=['POST'])
def verify_admin():
    data = request.json
    evt = Evento.query.get(data['evento_id'])
    if evt and evt.admin_pass == data['password']:
        return jsonify({"valid": True})
    return jsonify({"valid": False}), 401

# 4. Gestión de un evento específico (Ver, Editar, Borrar)
@app.route('/evento/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def single_event(id):
    evt = Evento.query.get_or_404(id)
    if request.method == 'DELETE':
        # Borrar metas y aportes asociados antes de borrar el evento
        metas = Meta.query.filter_by(evento_id=id).all()
        for m in metas:
            Aporte.query.filter_by(meta_id=m.id).delete()
            db.session.delete(m)
        db.session.delete(evt)
        db.session.commit()
        return jsonify({"msg": "Deleted"})
    if request.method == 'PUT':
        data = request.json
        evt.nombre = data.get('nombre', evt.nombre)
        evt.fecha = data.get('fecha', evt.fecha)
        db.session.commit()
    return jsonify({"id": evt.id, "nombre": evt.nombre, "fecha": evt.fecha})

# 5. Gestión de Metas (Crear y Listar)
@app.route('/metas/<int:evento_id>', methods=['GET', 'POST'])
def manage_metas(evento_id):
    if request.method == 'GET':
        metas = Meta.query.filter_by(evento_id=evento_id).all()
        return jsonify([{ 
            "id": m.id, "nombre": m.nombre, "objetivo": m.objetivo, 
            "unidad": m.unidad, "categoria": m.categoria, "prioridad": m.prioridad 
        } for m in metas])
    
    data = request.json
    nueva = Meta(
        nombre=data['nombre'], 
        objetivo=int(data['objetivo']),
        unidad=data.get('unidad', 'Unidades'),
        categoria=data.get('categoria', 'Comida'),
        prioridad=data.get('prioridad', 'Normal'),
        evento_id=evento_id
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify({"id": nueva.id}), 201

# 6. Borrar Meta
@app.route('/metas/<int:id>', methods=['DELETE'])
def delete_meta(id):
    meta = Meta.query.get_or_404(id)
    Aporte.query.filter_by(meta_id=id).delete()
    db.session.delete(meta)
    db.session.commit()
    return jsonify({"msg": "Deleted"})

# 7. Obtener Aportes de un evento
@app.route('/aportes/evento/<int:evento_id>', methods=['GET'])
def get_aportes_evento(evento_id):
    # Primero obtenemos los IDs de las metas de este evento
    metas = Meta.query.with_entities(Meta.id).filter_by(evento_id=evento_id).all()
    ids = [m.id for m in metas]
    if not ids: return jsonify([])
    # Luego buscamos los aportes asociados a esas metas
    aportes = Aporte.query.filter(Aporte.meta_id.in_(ids)).all()
    return jsonify([{ "id": a.id, "meta_id": a.meta_id, "encargado": a.encargado, "cantidad": a.cantidad, "estado": a.estado } for a in aportes])

# 8. Crear Aporte
@app.route('/aportes', methods=['POST'])
def create_aporte():
    data = request.json
    nuevo = Aporte(meta_id=data['meta_id'], encargado=data['encargado'], cantidad=int(data['cantidad']))
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"id": nuevo.id}), 201

# 9. Modificar/Borrar Aporte
@app.route('/aportes/<int:id>', methods=['DELETE', 'PUT'])
def modify_aporte(id):
    ap = Aporte.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(ap)
        db.session.commit()
        return jsonify({"msg": "Deleted"})
    data = request.json
    if 'estado' in data: ap.estado = data['estado']
    db.session.commit()
    return jsonify({"msg": "Updated"})

# 10. Reiniciar Evento (Borrar todo el contenido pero dejar el evento)
@app.route('/reset/<int:evento_id>', methods=['DELETE'])
def reset_evento(evento_id):
    metas = Meta.query.filter_by(evento_id=evento_id).all()
    for m in metas:
        Aporte.query.filter_by(meta_id=m.id).delete()
        db.session.delete(m)
    db.session.commit()
    return jsonify({"msg": "Reset"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)