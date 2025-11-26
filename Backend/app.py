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

# --- MODELOS DE DATOS ---
class Evento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), default="Mi Evento Especial")
    fecha = db.Column(db.String(50), default="")

class Meta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    objetivo = db.Column(db.Integer, nullable=False)
    categoria = db.Column(db.String(50), default="Comida") 
    prioridad = db.Column(db.String(20), default="Normal")

class Aporte(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meta_id = db.Column(db.Integer, db.ForeignKey('meta.id'), nullable=False)
    encargado = db.Column(db.String(100), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()
    if not Evento.query.first():
        db.session.add(Evento(nombre="Nombre del Evento", fecha=""))
        db.session.commit()

# --- RUTAS ---
@app.route('/config', methods=['GET', 'PUT'])
def manage_config():
    evt = Evento.query.first()
    if request.method == 'PUT':
        data = request.json
        evt.nombre = data.get('nombre', evt.nombre)
        evt.fecha = data.get('fecha', evt.fecha)
        db.session.commit()
    return jsonify({"nombre": evt.nombre, "fecha": evt.fecha})

@app.route('/reset', methods=['DELETE'])
def reset_all():
    try:
        db.session.query(Aporte).delete()
        db.session.query(Meta).delete()
        evt = Evento.query.first()
        evt.nombre = "Nuevo Evento"
        evt.fecha = ""
        db.session.commit()
        return jsonify({"msg": "Todo reiniciado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/metas', methods=['GET', 'POST'])
def manage_metas():
    if request.method == 'GET':
        return jsonify([{
            "id": m.id, 
            "nombre": m.nombre, 
            "objetivo": m.objetivo,
            "categoria": m.categoria,
            "prioridad": m.prioridad
        } for m in Meta.query.all()])
    
    data = request.json
    
    # Validaciones
    if int(data['objetivo']) <= 0:
        return jsonify({"error": "La cantidad debe ser positiva"}), 400
    
    if Meta.query.count() >= 50:
        return jsonify({"error": "Límite de metas alcanzado (Anti-Spam)"}), 400

    nueva = Meta(
        nombre=data['nombre'], 
        objetivo=int(data['objetivo']),
        categoria=data.get('categoria', 'Comida'),
        prioridad=data.get('prioridad', 'Normal')
    )
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
            "id": a.id, "meta_id": a.meta_id, 
            "encargado": a.encargado, "cantidad": a.cantidad, 
            "estado": a.estado
        } for a in Aporte.query.all()])
    
    data = request.json
    
    if int(data['cantidad']) <= 0:
         return jsonify({"error": "Aporte debe ser mayor a 0"}), 400

    nuevo = Aporte(
        meta_id=data['meta_id'], 
        encargado=data['encargado'], 
        cantidad=int(data['cantidad'])
    )
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
        if int(data['cantidad']) <= 0: return jsonify({"error": "No negativos"}), 400
        aporte.cantidad = int(data['cantidad'])
    if 'encargado' in data: aporte.encargado = data['encargado']
    
    db.session.commit()
    return jsonify({"msg": "Updated"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)