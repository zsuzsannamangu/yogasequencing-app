from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
from app.database import database

router = APIRouter(prefix="/sequences", tags=["sequences"])

# Pydantic models
class PoseData(BaseModel):
    filePath: str
    poseName: str

class SequenceCreate(BaseModel):
    name: str
    description: str
    duration: str
    poseCount: int
    poses: List[PoseData]
    category: Optional[str] = None
    privacy: Optional[str] = 'private'
    industryLabel: Optional[str] = 'Yoga'

class SequenceResponse(BaseModel):
    id: str
    name: str
    description: str
    duration: str
    poseCount: int
    poses: List[PoseData]
    createdAt: str
    category: Optional[str] = None
    privacy: Optional[str] = 'private'
    industryLabel: Optional[str] = 'Yoga'

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    createdAt: str

# Category endpoints
@router.post("/categories/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    """Create a new category"""
    query = """
        INSERT INTO categories (name, description, created_at)
        VALUES (:name, :description, :created_at)
        RETURNING id, name, description, created_at
    """
    values = {
        "name": category.name,
        "description": category.description,
        "created_at": datetime.now()
    }
    
    try:
        result = await database.fetch_one(query, values)
        return CategoryResponse(
            id=str(result["id"]),
            name=result["name"],
            description=result["description"],
            createdAt=result["created_at"].isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@router.get("/categories/", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories"""
    query = "SELECT id, name, description, created_at FROM categories ORDER BY name"
    
    try:
        results = await database.fetch_all(query)
        return [
            CategoryResponse(
                id=str(result["id"]),
                name=result["name"],
                description=result["description"],
                createdAt=result["created_at"].isoformat()
            )
            for result in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category if it has no sequences"""
    # First check if category exists
    check_query = "SELECT id FROM categories WHERE id = :id"
    category = await database.fetch_one(check_query, {"id": category_id})
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if any sequences are using this category
    sequences_query = "SELECT id FROM sequences WHERE category = :category_id"
    sequences = await database.fetch_all(sequences_query, {"category_id": category_id})
    
    if sequences:
        raise HTTPException(status_code=400, detail="Cannot delete category that has sequences")
    
    # Delete the category
    delete_query = "DELETE FROM categories WHERE id = :id"
    try:
        await database.execute(delete_query, {"id": category_id})
        return {"message": "Category deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")

# Sequence endpoints
@router.post("/", response_model=SequenceResponse)
async def create_sequence(sequence: SequenceCreate):
    """Create a new sequence"""
    try:
        # Debug logging
        print(f"Received sequence data: {sequence.dict()}")
        print(f"Industry Label: {sequence.industryLabel}")
        
        # Generate unique ID
        sequence_id = f"seq_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(sequence.name)}"
        
        # Save to database - handle missing columns gracefully
        try:
            # Try with all columns first
            query = """
            INSERT INTO sequences (id, name, description, duration, pose_count, poses, created_at, category, privacy, industry_label)
            VALUES (:id, :name, :description, :duration, :pose_count, :poses, :created_at, :category, :privacy, :industry_label)
            """
            
            await database.execute(
                query,
                {
                    "id": sequence_id,
                    "name": sequence.name,
                    "description": sequence.description,
                    "duration": sequence.duration,
                    "pose_count": sequence.poseCount,
                    "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                    "created_at": datetime.now(),
                    "category": sequence.category,
                    "privacy": sequence.privacy,
                    "industry_label": sequence.industryLabel
                }
            )
        except Exception as e:
            try:
                # Fallback to insert without industry_label column
                query = """
                INSERT INTO sequences (id, name, description, duration, pose_count, poses, created_at, category, privacy)
                VALUES (:id, :name, :description, :duration, :pose_count, :poses, :created_at, :category, :privacy)
                """
                
                await database.execute(
                    query,
                    {
                        "id": sequence_id,
                        "name": sequence.name,
                        "description": sequence.description,
                        "duration": sequence.duration,
                        "pose_count": sequence.poseCount,
                        "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                        "created_at": datetime.now(),
                        "category": sequence.category,
                        "privacy": sequence.privacy
                    }
                )
            except Exception as e2:
                # Final fallback to insert without privacy and industry_label columns
                query = """
                INSERT INTO sequences (id, name, description, duration, pose_count, poses, created_at, category)
                VALUES (:id, :name, :description, :duration, :pose_count, :poses, :created_at, :category)
                """
                
                await database.execute(
                    query,
                    {
                        "id": sequence_id,
                        "name": sequence.name,
                        "description": sequence.description,
                        "duration": sequence.duration,
                        "pose_count": sequence.poseCount,
                        "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                        "created_at": datetime.now(),
                        "category": sequence.category
                    }
                )
        
        return SequenceResponse(
            id=sequence_id,
            name=sequence.name,
            description=sequence.description,
            duration=sequence.duration,
            poseCount=sequence.poseCount,
            poses=sequence.poses,
            createdAt=datetime.now().isoformat(),
            category=sequence.category,
            privacy=sequence.privacy if hasattr(sequence, 'privacy') else "private",
            industryLabel=sequence.industryLabel if hasattr(sequence, 'industryLabel') else "Yoga"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create sequence: {str(e)}")

@router.get("/", response_model=List[SequenceResponse])
async def get_sequences():
    """Get all sequences"""
    try:
        query = "SELECT * FROM sequences ORDER BY created_at DESC"
        result = await database.fetch_all(query)
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "private",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga"
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sequences: {str(e)}")

@router.get("/public/", response_model=List[SequenceResponse])
async def get_public_sequences():
    """Get only public sequences"""
    try:
        query = "SELECT * FROM sequences WHERE privacy = 'public' ORDER BY created_at DESC"
        result = await database.fetch_all(query)
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "public",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga"
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve public sequences: {str(e)}")

@router.get("/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(sequence_id: str):
    """Get a specific sequence by ID"""
    try:
        query = "SELECT * FROM sequences WHERE id = :id"
        result = await database.fetch_one(query, {"id": sequence_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Parse poses JSON back to list
        poses_data = json.loads(result["poses"]) if result["poses"] else []
        poses = [PoseData(**pose) for pose in poses_data]
        
        return SequenceResponse(
            id=result["id"],
            name=result["name"],
            description=result["description"],
            duration=result["duration"],
            poseCount=result["pose_count"],
            poses=poses,
            createdAt=result["created_at"].isoformat() if result["created_at"] else None,
            category=result["category"] if "category" in result else None,
            privacy=result["privacy"] if "privacy" in result else "private",
            industryLabel=result["industry_label"] if "industry_label" in result else "Yoga"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sequence: {str(e)}")

@router.get("/debug/schema/", response_model=dict)
async def get_database_schema():
    """Debug endpoint to check database schema"""
    try:
        # Check if industry_label column exists
        query = """
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'sequences' 
        ORDER BY ordinal_position;
        """
        result = await database.fetch_all(query)
        
        columns = {}
        for row in result:
            columns[row["column_name"]] = {
                "type": row["data_type"],
                "nullable": row["is_nullable"],
                "default": row["column_default"]
            }
        
        return {"table": "sequences", "columns": columns}
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/industry-labels/", response_model=List[str])
async def get_available_industry_labels():
    """Get all available industry labels"""
    try:
        query = "SELECT DISTINCT industry_label FROM sequences WHERE industry_label IS NOT NULL ORDER BY industry_label"
        result = await database.fetch_all(query)
        
        labels = [row["industry_label"] for row in result]
        return labels
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve industry labels: {str(e)}")

@router.get("/by-industry/{industry_label}", response_model=List[SequenceResponse])
async def get_sequences_by_industry(industry_label: str):
    """Get sequences filtered by industry label"""
    try:
        query = "SELECT * FROM sequences WHERE industry_label = :industry_label ORDER BY created_at DESC"
        result = await database.fetch_all(query, {"industry_label": industry_label})
        
        sequences = []
        for row in result:
            # Parse poses JSON back to list
            poses_data = json.loads(row["poses"]) if row["poses"] else []
            poses = [PoseData(**pose) for pose in poses_data]
            
            sequences.append(SequenceResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                poseCount=row["pose_count"],
                poses=poses,
                createdAt=row["created_at"].isoformat() if row["created_at"] else None,
                category=row["category"] if "category" in row else None,
                privacy=row["privacy"] if "privacy" in row else "private",
                industryLabel=row["industry_label"] if "industry_label" in row else "Yoga"
            ))
        
        return sequences
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sequences by industry: {str(e)}")

@router.put("/{sequence_id}", response_model=SequenceResponse)
async def update_sequence(sequence_id: str, sequence: SequenceCreate):
    """Update an existing sequence"""
    try:
        # First check if sequence exists
        check_query = "SELECT id FROM sequences WHERE id = :id"
        existing = await database.fetch_one(check_query, {"id": sequence_id})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Update the sequence
        try:
            # Try with all columns first
            query = """
            UPDATE sequences 
            SET name = :name, description = :description, duration = :duration, 
                pose_count = :pose_count, poses = :poses, category = :category, 
                privacy = :privacy, industry_label = :industry_label
            WHERE id = :id
            """
            
            await database.execute(
                query,
                {
                    "id": sequence_id,
                    "name": sequence.name,
                    "description": sequence.description,
                    "duration": sequence.duration,
                    "pose_count": sequence.poseCount,
                    "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                    "category": sequence.category,
                    "privacy": sequence.privacy,
                    "industry_label": sequence.industryLabel
                }
            )
        except Exception as e:
            # Fallback to update without industry_label column
            query = """
            UPDATE sequences 
            SET name = :name, description = :description, duration = :duration, 
                pose_count = :pose_count, poses = :poses, category = :category, 
                privacy = :privacy
            WHERE id = :id
            """
            
            await database.execute(
                query,
                {
                    "id": sequence_id,
                    "name": sequence.name,
                    "description": sequence.description,
                    "duration": sequence.duration,
                    "pose_count": sequence.poseCount,
                    "poses": json.dumps([pose.dict() for pose in sequence.poses]),
                    "category": sequence.category,
                    "privacy": sequence.privacy
                }
            )
        
        # Fetch and return the updated sequence
        updated_query = "SELECT * FROM sequences WHERE id = :id"
        result = await database.fetch_one(updated_query, {"id": sequence_id})
        
        # Parse poses JSON back to list
        poses_data = json.loads(result["poses"]) if result["poses"] else []
        poses = [PoseData(**pose) for pose in poses_data]
        
        return SequenceResponse(
            id=result["id"],
            name=result["name"],
            description=result["description"],
            duration=result["duration"],
            poseCount=result["pose_count"],
            poses=poses,
            createdAt=result["created_at"].isoformat() if result["created_at"] else None,
            category=result["category"] if "category" in result else None,
            privacy=result["privacy"] if "privacy" in result else "private",
            industryLabel=result["industry_label"] if "industry_label" in result else "Yoga"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update sequence: {str(e)}")

@router.delete("/{sequence_id}")
async def delete_sequence(sequence_id: str):
    """Delete a sequence by ID"""
    try:
        # First check if sequence exists
        check_query = "SELECT id FROM sequences WHERE id = :id"
        existing = await database.fetch_one(check_query, {"id": sequence_id})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Delete the sequence
        delete_query = "DELETE FROM sequences WHERE id = :id"
        await database.execute(delete_query, {"id": sequence_id})
        
        return {"message": "Sequence deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete sequence: {str(e)}")