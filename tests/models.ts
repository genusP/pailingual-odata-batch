import { IEntityBase, IComplexBase, IApiContextBase, ApiContext, csdl } from "pailingual-odata"

//@odata.type Default.TestEnum
export enum TestEnum {
    Type1 = 1,
    Type2 = 2
}

//@odata.type Default.ComplexType
export interface ComplexType extends IComplexBase{
    field: string
}

export type Context = ApiContext<IContext>;

export interface IContext extends IApiContextBase {
    readonly Parents: Parent[];
    readonly Childs: Child[];
    readonly Singleton: Parent;
    readonly OpenTypes: OpenType[];
    readonly TestEntities: TestEntity[];

    $$Functions: {
        unboundFuncPrimitive(testArg: string | null): string;
        unboundFuncPrimitiveCol(): string[];
        unboundFuncComplex(): ComplexType;
        unboundFuncComplexCol(): ComplexType[];
        unboundFuncEntity(): Parent;
        unboundFuncEntityCol(): Parent[];
    };

    $$Actions: {
        unboundActionPrimitive(testArg: string, num: number): string;
        unboundActionPrimitiveCol(): string[];
        unboundActionComplex(): ComplexType;
        unboundActionComplexCol(): ComplexType[];
        unboundActionEntity(): Parent;
        unboundActionEntityCol(): Parent[];
        unboundAction(): void;
    }
}

//@odata.type Default.Parent
export interface Parent extends IEntityBase {
    $$Keys: "id";

    id: number;
    strField: string;
    numberField?: number;
    boolField?: boolean;
    dateField?: Date;
    guid?: string;
    complexType?: ComplexType;
    enumField?: TestEnum;

    childs?: Child[];
    entities?: TestEntity[];

    $$Actions: {
        boundAction(): void;
    };
    $$Functions: {
        entityBoundFuncPrimitive(): string,
        entityBoundFuncComplexCol(): ComplexType[]
        entityBoundFuncEntityCol(): Child[]
    };
    $$EntitySetFunctions: {
        colBoundFuncPrimitive(): number
    };
    $$EntitySetActions: {
        colBoundAction(): void
    }
}

//@odata.type Default.ParentEx
export interface ParentEx extends Parent {
    exField: string;
}

//@odata.type Default.Child
export interface Child extends IEntityBase {
    $$Keys: "id";
    id: string;
    parentId: number;
    childField: string;
    parent?: Parent;
    firstDetail?: ChildDetail;
    details?: ChildDetail[];
}

//@odata.type Default.ChildDetail
export interface ChildDetail extends IEntityBase {
    detailsId: number
    childId: number
    enumField?: TestEnum
}

//This entity use for get metadata by context. Don`t set @odata.type
export interface TestEntity extends IEntityBase {
    id: number;
    parentId: number;
    testEntityField: string;
}

//@odata.type Default.OpenType
export interface OpenType extends IEntityBase {
    prop1: number;
    prop2?: string;
    prop3?: ComplexType[];
    prop4?: boolean;
}

export function createMetadata(version: "4.0" | "4.01"="4.0") {
    const md= {
        $ApiRoot: "/api",
        $Version: version || "4.0",
        $EntityContainer: "Default.Container",
        "Default": {
            $Alias: "self",
            "Child": {
                $Kind: csdl.CsdlKind.EntityType,
                $Key: ["id"],
                id: {},
                parentId: { $Type: "Edm.Int32" },
                childField: {},
                parent: { $Kind: csdl.CsdlKind.NavigationProperty, $Type: "self.Parent" },
                firstDetail: { $Kind: csdl.CsdlKind.NavigationProperty, $Type: "self.ChildDetail", $Nullable: true },
                details: { $Kind: csdl.CsdlKind.NavigationProperty, $Type: "self.ChildDetail", $Collection: true }
            },
            "ChildDetail": {
                $Kind: csdl.CsdlKind.EntityType,
                detailsId: { $Type: "Edm.Int32" },
                childId: { $Type: "Edm.Int32" },
                enumField: { $Type: "self.TestEnum", $Nullable: true }
            },
            "ComplexType": {
                $Kind: csdl.CsdlKind.ComplexType,
                "field": {}
            },
            "Container": {
                $Kind: csdl.CsdlKind.EntityContainer,
                "Parents": {
                    $Kind: csdl.CsdlKind.EntitySet,
                    $Type: "self.Parent"
                },
                "Childs": {
                    $Kind: csdl.CsdlKind.EntitySet,
                    $Type: "self.Child"
                },
                "OpenTypes": {
                    $Kind: csdl.CsdlKind.EntitySet,
                    $Type: "self.OpenType"
                },
                "TestEntities": {
                    $Kind: csdl.CsdlKind.EntitySet,
                    $Type: "self.TestEntity"
                },
                "Singleton": {
                    $Kind: csdl.CsdlKind.Singleton,
                    $Type: "self.Parent"
                },
                "unboundFuncPrimitive": {
                    $Kind: csdl.CsdlKind.FunctionImport,
                    $Function: "self.unboundFuncPrimitive"
                },
                "unboundFuncPrimitiveCol": {
                    $Kind: csdl.CsdlKind.FunctionImport,
                    $Function: "self.unboundFuncPrimitiveCol"
                },
                "unboundFuncComplex": {
                    $Kind: csdl.CsdlKind.FunctionImport,
                    $Function: "self.unboundFuncComplex"
                },
                "unboundFuncComplexCol": {
                    $Kind: csdl.CsdlKind.FunctionImport,
                    $Function: "self.unboundFuncComplexCol"
                },
                "unboundFuncEntity": {
                    $Kind: csdl.CsdlKind.FunctionImport,
                    $Function: "self.unboundFuncEntity"
                },
                "unboundFuncEntityCol": {
                    $Kind: csdl.CsdlKind.FunctionImport,
                    $Function: "self.unboundFuncEntityCol"
                },
                "unboundActionPrimitive": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundActionPrimitive"
                },
                "unboundActionPrimitiveCol": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundActionPrimitiveCol"
                },
                "unboundActionComplex": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundActionComplex"
                },
                "unboundActionComplexCol": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundActionComplexCol"
                },
                "unboundActionEntity": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundActionEntity"
                },
                "unboundActionEntityCol": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundActionEntityCol"
                },
                "unboundAction": {
                    $Kind: csdl.CsdlKind.ActionImport,
                    $Action: "self.unboundAction"
                }
            },
            "OpenType": {
                $Kind: csdl.CsdlKind.EntityType,
                $OpenType: true
            },
            "Parent": {
                $Kind: csdl.CsdlKind.EntityType,
                $Key: ["id"],
                "id": { $Type: "Edm.Int32" },
                "strField": {},
                "numberField": { $Type: "Edm.Int32", $Nullable: true },
                "boolField": { $Type: "Edm.Boolean", $Nullable: true },
                "dateField": { $Type: "Edm.DateTimeOffset", $Nullable: true },
                "guid": { $Type: "Edm.Guid", $Nullable: true },
                "complexType": { $Type: "self.ComplexType", $Nullable: true },
                "enumField": { $Type: "self.TestEnum", $Nullable: true },
                "childs": { $Kind: csdl.CsdlKind.NavigationProperty, $Type: "self.Child", $Collection: true },
                "entities": { $Kind: csdl.CsdlKind.NavigationProperty, $Type: "self.TestEntity", $Collection: true }
            },
            "ParentEx": {
                $Kind: csdl.CsdlKind.EntityType,
                $BaseType: "self.Parent",
                "exField": {}
            },
            "TestEntity": {
                $Kind: csdl.CsdlKind.EntityType,
                id: { $Type: "Edm.Int32" },
                parentId: { $Type: "Edm.Int32" },
                testEntityField: {}
            },
            "TestEnum": {
                $Kind: csdl.CsdlKind.EnumType,
                "Type1": 1,
                "Type2": 2
            },
            "boundAction": [{
                $Kind: csdl.CsdlKind.Action,
                $IsBound: true,
                $Parameter: [
                    { $Name: "bindingParameter", $Type: "self.Parent" }
                ]
            }],
            "colBoundFuncPrimitive": [{
                $Kind: csdl.CsdlKind.Function,
                $IsBound: true,
                $Parameter: [
                    { $Name: "bindingParameter", $Type: "self.Parent", $Collection: true, $Nullable: true }
                ],
                $ReturnType: { $Type: "Edm.String" }
            }],
            "colBoundAction": [{
                $Kind: csdl.CsdlKind.Action,
                $IsBound: true,
                $Parameter: [
                    { $Name: "bindingParameter", $Type: "self.Parent", $Collection: true, $Nullable: true }
                ]
            }],
            "entityBoundFuncPrimitive": [{
                $Kind: csdl.CsdlKind.Function,
                $IsBound: true,
                $Parameter: [
                    { $Name: "bindingParameter", $Type: "self.Parent" }
                ],
                $ReturnType: { $Type: "Edm.String" }

            }],
            "entityBoundFuncComplexCol": [{
                $Kind: csdl.CsdlKind.Function,
                $IsBound: true,
                $Parameter: [
                    { $Name: "bindingParameter", $Type: "self.Parent" }
                ],
                $ReturnType: { $Type: "self.ComplexType", $Nullable: true, $Collection: true }

            }],
            "entityBoundFuncEntityCol": [{
                $Kind: csdl.CsdlKind.Function,
                $IsBound: true,
                $Parameter: [
                    { $Name: "bindingParameter", $Type: "self.Parent" }
                ],
                $ReturnType: { $Type: "self.Child", $Nullable: true, $Collection: true }
            }],
            "unboundFuncPrimitive": [{
                $Kind: csdl.CsdlKind.Function,
                $Parameter: [
                    { $Name: "testArg" }
                ],
                $ReturnType: { $Type: "Edm.String" }
            }],
            "unboundFuncPrimitiveCol": [{
                $Kind: csdl.CsdlKind.Function,
                $ReturnType: { $Type: "Edm.String", $Nullable: true, $Collection: true }
            }],
            "unboundFuncComplex": [{
                $Kind: csdl.CsdlKind.Function,
                $ReturnType: { $Type: "self.ComplexType" }
            }],
            "unboundFuncComplexCol": [{
                $Kind: csdl.CsdlKind.Function,
                $ReturnType: { $Type: "self.ComplexType", $Nullable: true, $Collection: true }
            }],
            "unboundFuncEntity": [{
                $Kind: csdl.CsdlKind.Function,
                $ReturnType: { $Type: "self.Parent" }
            }],
            "unboundFuncEntityCol": [{
                $Kind: csdl.CsdlKind.Function,
                $ReturnType: { $Type: "self.Parent", $Nullable: true, $Collection: true }
            }],
            "unboundActionPrimitive": [{
                $Kind: csdl.CsdlKind.Action,
                $Parameter: [
                    { $Name: "testArg" },
                    { $Name: "num", $Type: "Edm.Int32" }
                ],
                $ReturnType: { $Type: "Edm.String" }
            }],
            "unboundActionPrimitiveCol": [{
                $Kind: csdl.CsdlKind.Action,
                $ReturnType: { $Type: "Edm.String", $Nullable: true, $Collection: true }
            }],
            "unboundActionComplex": [{
                $Kind: csdl.CsdlKind.Action,
                $ReturnType: { $Type: "self.ComplexType" }
            }],
            "unboundActionComplexCol": [{
                $Kind: csdl.CsdlKind.Action,
                $ReturnType: { $Type: "self.ComplexType", $Nullable: true, $Collection: true }
            }],
            "unboundActionEntity": [{
                $Kind: csdl.CsdlKind.Action,
                $ReturnType: { $Type: "self.Parent" }
            }],
            "unboundActionEntityCol": [{
                $Kind: csdl.CsdlKind.Action,
                $ReturnType: { $Type: "self.Parent", $Nullable: true, $Collection: true }
            }],
            "unboundAction": [{
                $Kind: csdl.CsdlKind.Action
            }],
        } as csdl.Namespace,
        "Namespace2": {
            "Entity": {
                $Kind: csdl.CsdlKind.ComplexType,
                "id": {}
            }
        } as csdl.Namespace
    }
    typeof csdl.setParents == "function" && csdl.setParents(md);
    var typeCheck = md as csdl.MetadataDocument;
    return md;
};