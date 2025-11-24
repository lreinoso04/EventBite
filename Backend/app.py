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

# 1. Configuración del Evento (Para guardar el nombre)
class Evento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), default="Mi Evento Especial")

# 2. Las Metas (El Menú)
class Meta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    objetivo = db.Column(db.Integer, nullable=False)

# 3. Los Aportes (Quién trae qué)
class Aporte(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meta_id = db.Column(db.Integer, db.ForeignKey('meta.id'), nullable=False)
    encargado = db.Column(db.String(100), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()
    # Crear configuración por defecto si no existe
    if not Evento.query.first():
        db.session.add(Evento(nombre="Nombre del Evento"))
        db.session.commit()

# --- RUTAS DE CONTROL (RESET Y NOMBRE) ---

@app.route('/config', methods=['GET'])
def get_config():
    evt = Evento.query.first()
    return jsonify({"nombre": evt.nombre})

@app.route('/config', methods=['PUT'])
def update_config():
    data = request.json
    evt = Evento.query.first()
    evt.nombre = data.get('nombre', evt.nombre)
    db.session.commit()
    return jsonify({"nombre": evt.nombre})

@app.route('/reset', methods=['DELETE'])
def reset_all():
    """Borra todos los datos para empezar de cero"""
    try:
        db.session.query(Aporte).delete()
        db.session.query(Meta).delete()
        # Reiniciamos el nombre por defecto
        evt = Evento.query.first()
        evt.nombre = "Nuevo Evento"
        db.session.commit()
        return jsonify({"msg": "Todo reiniciado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- RUTAS CRUD (METAS Y APORTES) ---
# (Iguales que antes pero optimizadas)

@app.route('/metas', methods=['GET', 'POST'])
def manage_metas():
    if request.method == 'GET':
        return jsonify([{"id": m.id, "nombre": m.nombre, "objetivo": m.objetivo} for m in Meta.query.all()])
    
    data = request.json
    nueva = Meta(nombre=data['nombre'], objetivo=int(data['objetivo']))
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
            "id": a.id, "meta_id": a.meta_id, "encargado": a.encargado, 
            "cantidad": a.cantidad, "estado": a.estado
        } for a in Aporte.query.all()])
    
    data = request.json
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
    if 'cantidad' in data: aporte.cantidad = int(data['cantidad'])
    if 'encargado' in data: aporte.encargado = data['encargado']
    db.session.commit()
    return jsonify({"msg": "Updated"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)